class YouTubeDownloader {
    constructor() {
        this.backendUrl = 'http://localhost:3000';
        this.currentDownload = null;
        this.initializeElements();
        this.attachEventListeners();
        this.checkBackendConnection();
        this.loadTheme();
        this.loadDownloadHistory();
    }

    initializeElements() {
        this.elements = {
            urlInput: document.getElementById('urlInput'),
            pasteBtn: document.getElementById('pasteBtn'),
            analyzeBtn: document.getElementById('analyzeBtn'),
            loadingSection: document.getElementById('loadingSection'),
            videoInfo: document.getElementById('videoInfo'),
            playlistInfo: document.getElementById('playlistInfo'),
            qualitySection: document.getElementById('qualitySection'),
            downloadSection: document.getElementById('downloadSection'),
            errorSection: document.getElementById('errorSection'),
            statusIndicator: document.getElementById('statusIndicator'),
            connectionStatus: document.getElementById('connectionStatus'),
            thumbnail: document.getElementById('thumbnail'),
            videoTitle: document.getElementById('videoTitle'),
            videoDuration: document.getElementById('videoDuration'),
            videoUploader: document.getElementById('videoUploader'),
            playlistVideos: document.getElementById('playlistVideos'),
            videoQuality: document.getElementById('videoQuality'),
            downloadFormat: document.getElementById('downloadFormat'),
            downloadFolder: document.getElementById('downloadFolder'),
            chooseFolderBtn: document.getElementById('chooseFolderBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            downloadProgress: document.getElementById('downloadProgress'),
            progressFill: document.getElementById('progressFill'),
            progressPercent: document.getElementById('progressPercent'),
            downloadSpeed: document.getElementById('downloadSpeed'),
            cancelBtn: document.getElementById('cancelBtn'),
            errorText: document.getElementById('errorText'),
            themeToggle: document.getElementById('themeToggle'),
            folderPicker: document.getElementById('folderPicker'),
            downloadHistory: document.getElementById('downloadHistory'),
            historyList: document.getElementById('historyList')
        };

        // Set default download path
        chrome.storage.local.get('downloadFolder', (data) => {
            if (data.downloadFolder) {
                this.elements.downloadFolder.value = data.downloadFolder;
            }
        });
    }

    attachEventListeners() {
        this.elements.pasteBtn.addEventListener('click', () => this.pasteFromClipboard());
        this.elements.analyzeBtn.addEventListener('click', () => this.analyzeUrl());
        this.elements.downloadBtn.addEventListener('click', () => this.startDownload());
        this.elements.cancelBtn.addEventListener('click', () => this.cancelDownload());
        this.elements.chooseFolderBtn.addEventListener('click', () => this.chooseDownloadFolder());
        this.elements.themeToggle.addEventListener('click', () => this.toggleTheme());
        this.elements.folderPicker.addEventListener('change', (e) => this.handleFolderSelection(e));

        // Handle playlist option changes
        document.querySelectorAll('input[name="playlistOption"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.handlePlaylistOptionChange(e.target.value));
        });

        // Auto-detect URLs when pasted
        this.elements.urlInput.addEventListener('paste', () => {
            setTimeout(() => this.validateUrl(), 100);
        });

        this.elements.urlInput.addEventListener('input', () => this.validateUrl());
    }

    chooseDownloadFolder() {
        // Trigger the hidden file input that has directory selection capability
        this.elements.folderPicker.click();
    }

    async checkBackendConnection() {
        try {
            const response = await fetch(`${this.backendUrl}/health`);
            if (response.ok) {
                this.updateConnectionStatus(true);
            } else {
                this.updateConnectionStatus(false);
            }
        } catch (error) {
            this.updateConnectionStatus(false);
        }
    }

    updateConnectionStatus(connected) {
        const statusDot = this.elements.statusIndicator.querySelector('.status-dot');
        if (connected) {
            statusDot.classList.add('connected');
            this.elements.connectionStatus.textContent = 'Backend Connected';
        } else {
            statusDot.classList.remove('connected');
            this.elements.connectionStatus.textContent = 'Backend Offline';
        }
    }

    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            this.elements.urlInput.value = text;
            this.validateUrl();
        } catch (error) {
            console.error('Failed to read clipboard:', error);
        }
    }

    validateUrl() {
        const url = this.elements.urlInput.value.trim();
        const isValidYouTubeUrl = this.isValidYouTubeUrl(url);

        this.elements.analyzeBtn.disabled = !isValidYouTubeUrl;
        this.elements.analyzeBtn.style.opacity = isValidYouTubeUrl ? '1' : '0.5';

        if (isValidYouTubeUrl) {
            this.hideError();
        }
    }

    isValidYouTubeUrl(url) {
        const patterns = [
            /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
            /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
            /^https?:\/\/(www\.)?youtube\.com\/playlist\?list=[\w-]+/,
            /^https?:\/\/youtu\.be\/[\w-]+/
        ];

        return patterns.some(pattern => pattern.test(url));
    }

    async analyzeUrl() {
        const url = this.elements.urlInput.value.trim();

        if (!this.isValidYouTubeUrl(url)) {
            this.showError('Please enter a valid YouTube URL');
            return;
        }

        this.showLoading(true);
        this.hideAllSections();

        try {
            const response = await fetch(`${this.backendUrl}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            this.displayVideoInfo(data);

        } catch (error) {
            console.error('Analysis error:', error);
            this.showError(`Failed to analyze URL: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    displayVideoInfo(data) {
        if (data.type === 'playlist') {
            this.displayPlaylistInfo(data);
        } else {
            this.displaySingleVideoInfo(data);
        }

        this.showQualitySection();
        this.showDownloadSection();
    }

    displaySingleVideoInfo(data) {
        this.elements.thumbnail.src = data.thumbnail || '';
        this.elements.videoTitle.textContent = data.title || 'Unknown Title';
        this.elements.videoDuration.textContent = `Duration: ${this.formatDuration(data.duration)}`;
        this.elements.videoUploader.textContent = `Uploader: ${data.uploader || 'Unknown'}`;

        this.elements.videoInfo.classList.remove('hidden');
        this.elements.playlistInfo.classList.add('hidden');
    }

    displayPlaylistInfo(data) {
        this.elements.playlistInfo.classList.remove('hidden');
        this.elements.videoInfo.classList.add('hidden');

        // Store playlist data for later use
        this.playlistData = data;

        // Display first video as preview
        if (data.videos && data.videos.length > 0) {
            const firstVideo = data.videos[0];
            this.elements.thumbnail.src = firstVideo.thumbnail || '';
            this.elements.videoTitle.textContent = `Playlist: ${data.title} (${data.videos.length} videos)`;
            this.elements.videoDuration.textContent = `Total Duration: ${this.formatDuration(data.totalDuration)}`;
            this.elements.videoUploader.textContent = `Uploader: ${firstVideo.uploader || 'Unknown'}`;
            this.elements.videoInfo.classList.remove('hidden');
        }
    }

    handlePlaylistOptionChange(option) {
        if (option === 'select') {
            this.showPlaylistVideos();
        } else {
            this.elements.playlistVideos.classList.add('hidden');
        }
    }

    showPlaylistVideos() {
        if (!this.playlistData || !this.playlistData.videos) return;

        const container = this.elements.playlistVideos;
        container.innerHTML = '';

        this.playlistData.videos.forEach((video, index) => {
            const videoItem = document.createElement('div');
            videoItem.className = 'playlist-video-item';
            videoItem.innerHTML = `
        <input type="checkbox" id="video-${index}" checked>
        <label for="video-${index}" class="playlist-video-info">
          <div>${video.title}</div>
          <div style="color: #666; font-size: 11px;">${this.formatDuration(video.duration)}</div>
        </label>
      `;
            container.appendChild(videoItem);
        });

        container.classList.remove('hidden');
    }

    toggleTheme() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        this.elements.themeToggle.textContent = isDark ? '🌙' : '☀️';
        chrome.storage.local.set({ theme: isDark ? 'light' : 'dark' });
    }

    loadTheme() {
        chrome.storage.local.get('theme', (data) => {
            if (data.theme === 'dark') {
                document.body.setAttribute('data-theme', 'dark');
                this.elements.themeToggle.textContent = '☀️';
            }
        });
    }

    handleFolderSelection(event) {
        const files = event.target.files;
        if (files.length > 0) {
            // Get the first file to extract the directory path
            const firstFile = files[0];
            let folderPath = '';

            if (firstFile.webkitRelativePath) {
                // Extract the directory path from webkitRelativePath
                const pathParts = firstFile.webkitRelativePath.split('/');
                // Remove the filename to get just the folder path
                pathParts.pop();
                folderPath = pathParts.join('/');
            } else if (firstFile.path) {
                // Fallback to path property if available
                folderPath = firstFile.path;
            }

            if (folderPath) {
                // Validate the folder path
                try {
                    // Store the selected folder path
                    this.elements.downloadFolder.value = folderPath;
                    // Save the selected folder to storage
                    chrome.storage.local.set({ downloadFolder: folderPath }, () => {
                        if (chrome.runtime.lastError) {
                            console.error('Error saving folder:', chrome.runtime.lastError);
                            this.showError('Failed to save download location');
                            this.elements.downloadFolder.value = 'Default folder';
                        } else {
                            this.showSuccess('Download location updated successfully');
                        }
                    });
                } catch (error) {
                    console.error('Folder selection error:', error);
                    this.showError('Invalid download location');
                    this.elements.downloadFolder.value = 'Default folder';
                }
            }
        }
    }

    loadDownloadHistory() {
        chrome.runtime.sendMessage({ action: 'getDownloadHistory' }, (response) => {
            const history = response.history || [];
            this.updateHistoryList(history);
        });
    }

    updateHistoryList(history) {
        this.elements.historyList.innerHTML = '';
        history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-title">${item.title}</div>
                <div class="history-item-details">
                    ${item.quality} ${item.format} • ${new Date(item.timestamp).toLocaleDateString()}
                </div>
                <button class="btn-secondary btn-small" onclick="window.open('file://${item.filePath}')">
                    Open File
                </button>
            `;
            this.elements.historyList.appendChild(historyItem);
        });

        if (history.length > 0) {
            this.elements.downloadHistory.classList.remove('hidden');
        }
    }

    async startDownload() {
        const url = this.elements.urlInput.value.trim();
        const quality = this.elements.videoQuality.value;
        const format = this.elements.downloadFormat.value;
        const downloadFolder = this.elements.downloadFolder.value;

        // Get video title from analysis data
        const videoTitle = this.elements.videoTitle.textContent;

        // Get selected videos for playlists
        let selectedVideos = null;
        if (this.playlistData && this.playlistData.type === 'playlist') {
            const playlistOption = document.querySelector('input[name="playlistOption"]:checked').value;
            if (playlistOption === 'select') {
                selectedVideos = [];
                const checkboxes = document.querySelectorAll('#playlistVideos input[type="checkbox"]');
                checkboxes.forEach((checkbox, index) => {
                    if (checkbox.checked) {
                        selectedVideos.push(index);
                    }
                });
            }
        }

        const downloadOptions = {
            url,
            quality,
            format,
            downloadFolder: downloadFolder === 'Default folder' ? null : downloadFolder,
            selectedVideos,
            title: videoTitle
        };

        try {
            // Show download UI
            this.elements.downloadBtn.style.display = 'none';
            this.elements.downloadProgress.classList.remove('hidden');

            // Start the download with direct backend communication for progress
            const response = await fetch(`${this.backendUrl}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(downloadOptions)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            this.currentDownload = { reader, response };

            // Also send to background for notifications
            chrome.runtime.sendMessage({
                action: 'startDownload',
                options: downloadOptions
            });

            // Process download progress stream
            while (true) {
                const { value, done } = await reader.read();

                if (done) break;

                const chunk = new TextDecoder().decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim()) continue;

                    try {
                        // Handle Server-Sent Events format
                        let jsonData;
                        if (line.startsWith('data: ')) {
                            // SSE format: "data: {...}"
                            jsonData = line.substring(6); // Remove "data: " prefix
                        } else {
                            // Plain JSON format
                            jsonData = line;
                        }

                        const progressData = JSON.parse(jsonData);
                        this.updateDownloadProgress(progressData);

                        // Also send progress to background for notifications
                        chrome.runtime.sendMessage({
                            action: 'downloadProgress',
                            data: progressData
                        });
                    } catch (parseError) {
                        console.error('Failed to parse progress data:', parseError, 'Line:', line);
                    }
                }
            }

        } catch (error) {
            console.error('Download error:', error);
            this.showError(`Download failed: ${error.message}`);
            this.resetDownloadUI();
        }
    }

    showSuccess(message) {
        const successSection = document.createElement('div');
        successSection.className = 'success-section';
        successSection.innerHTML = `
            <div class="success-message">
                <span>${message}</span>
            </div>
        `;
        this.elements.downloadSection.appendChild(successSection);
        setTimeout(() => successSection.remove(), 3000);
    }

    updateDownloadProgress(progressData) {
        if (progressData.error) {
            this.showError(progressData.error);
            this.resetDownloadUI();
            return;
        }

        if (progressData.progress !== undefined) {
            const percent = Math.round(progressData.progress);
            this.elements.progressFill.style.width = `${percent}%`;
            this.elements.progressPercent.textContent = `${percent}%`;
        }

        if (progressData.speed) {
            this.elements.downloadSpeed.textContent = progressData.speed;
        }

        if (progressData.message) {
            this.elements.downloadSpeed.textContent = progressData.message;
        }

        if (progressData.status === 'completed') {
            this.elements.progressPercent.textContent = '100%';
            this.elements.progressFill.style.width = '100%';
            this.elements.downloadSpeed.textContent = 'Download completed!';

            // Update download history
            this.loadDownloadHistory();

            setTimeout(() => {
                this.resetDownloadUI();
                this.showSuccess('Download completed successfully!');

                // Clear the form
                this.elements.urlInput.value = '';
                this.hideAllSections();
            }, 2000);
        }

        if (progressData.status === 'error') {
            this.showError(progressData.message || 'Download failed');
            this.resetDownloadUI();
        }
    }

    cancelDownload() {
        if (this.currentDownload) {
            // Cancel the streaming reader
            try {
                this.currentDownload.reader.cancel();
            } catch (error) {
                console.error('Error cancelling reader:', error);
            }

            // Send cancel request to backend
            fetch(`${this.backendUrl}/cancel`, { method: 'POST' });

            this.currentDownload = null;
        }
        this.resetDownloadUI();
        this.showError('Download cancelled');
    }

    resetDownloadUI() {
        this.elements.downloadBtn.style.display = 'block';
        this.elements.downloadProgress.classList.add('hidden');
        this.elements.progressFill.style.width = '0%';
        this.elements.progressPercent.textContent = '0%';
        this.elements.downloadSpeed.textContent = '';
    }

    showLoading(show) {
        this.elements.loadingSection.classList.toggle('hidden', !show);
    }

    showQualitySection() {
        this.elements.qualitySection.classList.remove('hidden');
    }

    showDownloadSection() {
        this.elements.downloadSection.classList.remove('hidden');
    }

    hideAllSections() {
        this.elements.videoInfo.classList.add('hidden');
        this.elements.playlistInfo.classList.add('hidden');
        this.elements.qualitySection.classList.add('hidden');
        this.elements.downloadSection.classList.add('hidden');
        this.elements.errorSection.classList.add('hidden');
    }

    showError(message) {
        this.elements.errorText.textContent = message;
        this.elements.errorSection.classList.remove('hidden');
    }

    hideError() {
        this.elements.errorSection.classList.add('hidden');
    }

    showSuccess(message) {
        const successSection = document.createElement('div');
        successSection.className = 'success-section';
        successSection.innerHTML = `
            <div class="success-message">
                <span>${message}</span>
            </div>
        `;
        this.elements.downloadSection.appendChild(successSection);
        setTimeout(() => successSection.remove(), 3000);
    }

    formatDuration(seconds) {
        if (!seconds) return 'Unknown';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize the extension when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new YouTubeDownloader();
});
