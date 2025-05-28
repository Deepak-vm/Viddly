# YouTube Video Downloader Chrome Extension

A Chrome extension that enables users to download YouTube videos and playlists with quality selection and playlist management.

## Features

### Core Features
- **URL Input**: Paste YouTube video or playlist URLs
- **Quality Selection**: Choose from 144p, 240p, 360p, 480p, 720p, 1080p
- **Audio Download**: Download audio-only (MP3, M4A)
- **Playlist Support**: Download entire playlists or select specific videos
- **Progress Tracking**: Real-time download progress and speed
- **Cancel/Pause**: Ability to cancel ongoing downloads

### User Interface
- Clean and intuitive popup interface
- Responsive design for various screen sizes
- Real-time backend connection status
- Video/playlist preview with thumbnails
- Download progress visualization

### Technical Features
- Backend integration with Node.js and yt-dlp
- Streaming progress updates
- Secure file handling
- Cross-platform compatibility

## Installation

### Prerequisites
- Node.js (v14 or higher)
- Chrome browser
- yt-dlp (will be installed automatically)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Install yt-dlp:
```bash
npm run install-ytdlp
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:3000`

### Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the extension directory
4. The extension will appear in your browser toolbar

## Usage

### Basic Download
1. Click the extension icon in Chrome toolbar
2. Paste a YouTube video URL
3. Click "Analyze URL"
4. Select desired quality and format
5. Click "Start Download"

### Playlist Download
1. Paste a YouTube playlist URL
2. Choose between downloading entire playlist or selecting specific videos
3. If selecting specific videos, check/uncheck videos in the list
4. Select quality and format
5. Start download

### Monitoring Downloads
- Progress bar shows download completion percentage
- Speed indicator shows current download speed
- Cancel button allows stopping downloads
- Backend connection status is displayed

## File Structure

```
YT-video-chrome-extension/
├── manifest.json          # Extension manifest
├── popup.html             # Extension popup interface
├── popup.css              # Popup styling
├── popup.js               # Popup functionality
├── background.js          # Background service worker
├── content.js             # Content script for YouTube pages
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── backend/               # Backend server
    ├── package.json       # Node.js dependencies
    ├── server.js          # Express server
    ├── bin/               # yt-dlp binary
    └── downloads/         # Downloaded files directory
```

## API Endpoints

### Backend Server Endpoints

- `GET /health` - Health check
- `POST /analyze` - Analyze YouTube URL
- `POST /download` - Start download (streaming response)
- `POST /cancel` - Cancel current download
- `GET /status` - Get download status
- `GET /downloads` - List downloaded files

## Configuration

### Quality Settings
- **144p**: Lowest quality, smallest file size
- **240p**: Low quality
- **360p**: Standard quality
- **480p**: Good quality
- **720p**: HD quality (default)
- **1080p**: Full HD quality

### Format Options
- **MP4**: Standard video format
- **WebM**: Alternative video format
- **MP3**: Audio only (converted)
- **M4A**: Audio only (high quality)

## Security & Compliance

### Security Measures
- CORS enabled for localhost only
- Input validation on all endpoints
- Secure file handling
- No user data collection

### Legal Compliance
⚠️ **Important Disclaimer**: This extension is for educational purposes only. Users must:
- Comply with YouTube's Terms of Service
- Respect copyright laws
- Only download content they have rights to
- Follow local laws and regulations

## Troubleshooting

### Common Issues

**Backend Connection Failed**
- Ensure Node.js backend is running on port 3000
- Check if yt-dlp is installed: `npm run install-ytdlp`
- Verify no firewall blocking localhost:3000

**Download Fails**
- Check internet connection
- Verify YouTube URL is valid and accessible
- Ensure yt-dlp is up to date
- Check backend logs for detailed error messages

**Extension Not Loading**
- Ensure Developer mode is enabled in Chrome
- Check for manifest.json errors
- Reload the extension after changes

### Backend Logs
Monitor backend console for detailed error messages and download progress.

## Development

### Adding New Features
1. Frontend changes: Modify popup.html, popup.css, popup.js
2. Backend changes: Update server.js
3. Content script changes: Modify content.js
4. Background script changes: Update background.js

### Testing
- Test with various YouTube URL formats
- Test playlist functionality
- Test different quality settings
- Test error handling scenarios

## Dependencies

### Backend Dependencies
- express: Web server framework
- cors: Cross-origin resource sharing
- fs-extra: Enhanced file system operations
- yt-dlp: YouTube video downloader

### Frontend Dependencies
- Native Chrome Extension APIs
- Fetch API for backend communication
- Modern JavaScript (ES6+)

## Browser Compatibility
- Chrome (Manifest V3)
- Chromium-based browsers

## License
MIT License - See LICENSE file for details



## Support
For issues and questions:
1. Check troubleshooting section
2. Review backend logs
3. Open GitHub issue with details

---

**Note**: This extension requires a local backend server to function. The backend handles video processing and downloading using yt-dlp.
# Viddly
