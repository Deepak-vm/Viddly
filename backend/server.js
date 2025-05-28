require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const downloadRoutes = require('./routes/download');
const errorHandler = require('./middlewares/errorHandler');
const { isValidYoutubeUrl } = require('./utils/validateUrl');

const app = express();

// Enable CORS for localhost
app.use(cors({
    origin: ['http://localhost:3000', 'chrome-extension://*'],
    credentials: true
}));

app.use(express.json());

// Global variables to track downloads
let currentDownload = null;
let downloadStatus = { status: 'idle' };

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Backend server is running',
        ytDlpAvailable: fs.existsSync(path.join(__dirname, 'bin', 'yt-dlp'))
    });
});

// Analyze YouTube URL endpoint
app.post('/analyze', async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!isValidYoutubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        // Use yt-dlp to get video information
        const ytdlpPath = path.join(__dirname, 'bin', 'yt-dlp');

        if (!fs.existsSync(ytdlpPath)) {
            return res.status(500).json({ error: 'yt-dlp not installed. Please run setup script.' });
        }

        const process = spawn(ytdlpPath, [
            '--dump-json',
            '--no-warnings',
            url
        ]);

        let output = '';
        let errorOutput = '';

        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        process.on('close', (code) => {
            if (code !== 0) {
                console.error('yt-dlp error:', errorOutput);
                return res.status(500).json({ error: 'Failed to analyze URL' });
            }

            try {
                // Robustly handle multiple JSON objects (e.g., playlist)
                const jsonLines = output
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.startsWith('{') && line.endsWith('}'));

                if (jsonLines.length === 0) {
                    throw new Error('No valid JSON found in yt-dlp output');
                }

                // If only one JSON object, parse it directly
                // If multiple, parse as an array (playlist)
                const videoInfo = jsonLines.length === 1
                    ? JSON.parse(jsonLines[0])
                    : jsonLines.map(line => JSON.parse(line));

                // Check if it's a playlist (array or _type === 'playlist')
                if (Array.isArray(videoInfo)) {
                    // Playlist: each entry is a video
                    res.json({
                        type: 'playlist',
                        videoCount: videoInfo.length,
                        videos: videoInfo.map(entry => ({
                            id: entry.id,
                            title: entry.title,
                            duration: entry.duration,
                            thumbnail: entry.thumbnail
                        }))
                    });
                } else if (videoInfo._type === 'playlist') {
                    // Playlist object (yt-dlp sometimes outputs a single playlist object)
                    res.json({
                        type: 'playlist',
                        title: videoInfo.title,
                        videoCount: videoInfo.entries ? videoInfo.entries.length : 0,
                        videos: videoInfo.entries ? videoInfo.entries.map(entry => ({
                            id: entry.id,
                            title: entry.title,
                            duration: entry.duration,
                            thumbnail: entry.thumbnail
                        })) : []
                    });
                } else {
                    // Single video
                    res.json({
                        type: 'video',
                        videoId: videoInfo.id,
                        title: videoInfo.title,
                        duration: videoInfo.duration,
                        thumbnail: videoInfo.thumbnail,
                        uploader: videoInfo.uploader
                    });
                }
            } catch (error) {
                console.error('Analyze error:', error);
                res.status(500).json({ error: 'Failed to analyze video/playlist' });
            }
        });
    } catch (error) {
        console.error('Analyze error:', error);
        res.status(500).json({ error: 'Failed to analyze video/playlist' });
    }
});


app.post('/download', (req, res) => {
    try {
        const { url, quality = '720p', format = 'mp4', downloadFolder, selectedIds } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        if (!isValidYoutubeUrl(url)) {
            return res.status(400).json({ error: 'Invalid YouTube URL' });
        }

        const ytdlpPath = path.join(__dirname, 'bin', 'yt-dlp');
        const outputDir = downloadFolder || path.join(__dirname, 'downloads');

        // Ensure download directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Set headers for streaming response
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });

        // Build yt-dlp command
        const args = [
            '--newline',
            '--progress',
            '-o', `${outputDir}/%(title)s.%(ext)s`,
            url
        ];

        // Add playlist selection if provided
        if (selectedIds && Array.isArray(selectedIds) && selectedIds.length > 0) {
            args.push('--playlist-items', selectedIds.join(','));
        }

        // Add quality/format options
        if (format === 'mp3') {
            args.push('--extract-audio', '--audio-format', 'mp3');
        } else if (format === 'm4a') {
            args.push('--extract-audio', '--audio-format', 'm4a');
        } else {
            args.push('-f', `best[height<=${quality.replace('p', '')}]`);
        }

        downloadStatus = { status: 'downloading', progress: 0 };
        currentDownload = spawn(ytdlpPath, args);

        currentDownload.stdout.on('data', (data) => {
            const output = data.toString();
            res.write(`data: ${JSON.stringify({ type: 'progress', data: output })}\n\n`);

            // Improved: parse all percentage matches in the output
            const progressRegex = /(\d{1,3}\.\d+)%/g;
            let match;
            let lastProgress = null;
            while ((match = progressRegex.exec(output)) !== null) {
                lastProgress = parseFloat(match[1]);
            }
            if (lastProgress !== null) {
                downloadStatus.progress = lastProgress;
            }
        });


        currentDownload.stderr.on('data', (data) => {
            const error = data.toString();
            res.write(`data: ${JSON.stringify({ type: 'error', data: error })}\n\n`);
        });

        currentDownload.on('close', (code) => {
            if (code === 0) {
                downloadStatus = { status: 'completed', progress: 100 };
                res.write(`data: ${JSON.stringify({ type: 'complete', message: 'Download completed successfully' })}\n\n`);
            } else {
                downloadStatus = { status: 'error', progress: 0 };
                res.write(`data: ${JSON.stringify({ type: 'error', message: 'Download failed' })}\n\n`);
            }
            res.end();
            currentDownload = null;
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to start download' });
    }
});

// Cancel download endpoint
app.post('/cancel', (req, res) => {
    if (currentDownload) {
        currentDownload.kill('SIGTERM');
        currentDownload = null;
        downloadStatus = { status: 'cancelled', progress: 0 };
        res.json({ message: 'Download cancelled' });
    } else {
        res.json({ message: 'No active download to cancel' });
    }
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json(downloadStatus);
});

// List downloads endpoint
app.get('/downloads', (req, res) => {
    try {
        const downloadsDir = path.join(__dirname, 'downloads');

        if (!fs.existsSync(downloadsDir)) {
            return res.json([]);
        }

        const files = fs.readdirSync(downloadsDir).map(file => {
            const filePath = path.join(downloadsDir, file);
            const stats = fs.statSync(filePath);
            return {
                name: file,
                path: filePath,
                size: stats.size,
                created: stats.birthtime
            };
        });

        res.json(files);
    } catch (error) {
        console.error('List downloads error:', error);
        res.status(500).json({ error: 'Failed to list downloads' });
    }
});

// Install yt-dlp endpoint
app.post('/install-ytdlp', async (req, res) => {
    try {
        const binDir = path.join(__dirname, 'bin');

        if (!fs.existsSync(binDir)) {
            fs.mkdirSync(binDir, { recursive: true });
        }

        // Download yt-dlp binary (this is a simplified version)
        res.json({ message: 'yt-dlp installation would be triggered here', success: true });
    } catch (error) {
        console.error('Install yt-dlp error:', error);
        res.status(500).json({ error: 'Failed to install yt-dlp' });
    }
});

app.use('/api/download', downloadRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3001 || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
