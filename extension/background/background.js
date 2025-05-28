// Background script for the YouTube Downloader extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('YouTube Downloader extension installed');

    // Initialize download history
    chrome.storage.local.get('downloadHistory', (data) => {
        if (!data.downloadHistory) {
            chrome.storage.local.set({ downloadHistory: [] });
        }
    });

    // Create context menu item (only if it doesn't exist)
    try {
        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: 'downloadVideo',
                title: 'Download this video',
                contexts: ['page'],
                documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*']
            });
        });
    } catch (e) {
        console.error('Error creating context menu:', e);
    }
});

// Track active downloads
let activeDownloads = new Map();

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downloadVideo' && tab.url.includes('youtube.com')) {
        chrome.action.openPopup();
    }
});

// Handle messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getVideoInfo') {
        // Extract video information from the current YouTube page
        handleVideoInfoRequest(request, sender, sendResponse);
        return true; // Will respond asynchronously
    }

    if (request.action === 'downloadProgress') {
        // Update download progress
        updateDownloadProgress(request.data);
    }

    // Handle download messages from popup
    if (request.action === 'startDownload') {
        handleDownload(request.options);
        sendResponse({ success: true });
        return true;
    }

    if (request.action === 'getDownloadHistory') {
        chrome.storage.local.get('downloadHistory', (data) => {
            sendResponse({ history: data.downloadHistory || [] });
        });
        return true;
    }
});

async function handleVideoInfoRequest(request, sender, sendResponse) {
    try {
        // Get current active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (tab.url.includes('youtube.com')) {
            // Execute content script to extract video information
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractVideoInfo
            });

            sendResponse({ success: true, data: results[0].result });
        } else {
            sendResponse({ success: false, error: 'Not a YouTube page' });
        }
    } catch (error) {
        sendResponse({ success: false, error: error.message });
    }
}

function extractVideoInfo() {
    // This function will be injected into the YouTube page
    const videoElement = document.querySelector('video');
    const titleElement = document.querySelector('h1.title yt-formatted-string');
    const channelElement = document.querySelector('#owner-name a');

    return {
        url: window.location.href,
        title: titleElement ? titleElement.textContent : 'Unknown Title',
        channel: channelElement ? channelElement.textContent : 'Unknown Channel',
        duration: videoElement ? videoElement.duration : null,
        currentTime: videoElement ? videoElement.currentTime : null
    };
}

function updateDownloadProgress(progressData) {
    // Store progress data in chrome.storage for popup to access
    chrome.storage.local.set({ downloadProgress: progressData });

    // Update badge text with progress percentage
    if (progressData.progress !== undefined) {
        const percentage = Math.round(progressData.progress);
        chrome.action.setBadgeText({ text: `${percentage}%` });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    }

    // Clear badge when download is complete
    if (progressData.status === 'completed') {
        setTimeout(() => {
            chrome.action.setBadgeText({ text: '' });
        }, 3000);
    }
}

// Handle downloads initiated from context menu (future feature)
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'downloadVideo' && tab.url.includes('youtube.com')) {
        // Open popup or handle download directly
        chrome.action.openPopup();
    }
});

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'downloadVideo',
        title: 'Download this video',
        contexts: ['page'],
        documentUrlPatterns: ['*://www.youtube.com/*', '*://youtube.com/*']
    });
});

async function handleDownload(options) {
    const downloadId = Date.now().toString();

    // Add to active downloads
    activeDownloads.set(downloadId, {
        status: 'downloading',
        progress: 0,
        ...options
    });

    // Create notification
    chrome.notifications.create(`download_${downloadId}`, {
        type: 'progress',
        iconUrl: '/icons/icon128.png',
        title: 'Download Started',
        message: `Downloading: ${options.title}`,
        progress: 0
    });

    try {
        const response = await fetch('http://localhost:3000/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        });

        const reader = response.body.getReader();

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

                    const update = JSON.parse(jsonData);
                    updateDownloadProgress(downloadId, update);
                } catch (parseError) {
                    console.error('Failed to parse progress data:', parseError, 'Line:', line);
                }
            }
        }
    } catch (error) {
        console.error('Download error:', error);
        updateDownloadProgress(downloadId, {
            status: 'error',
            message: 'Download failed: ' + error.message
        });
    }
}

function updateDownloadProgress(downloadId, update) {
    const download = activeDownloads.get(downloadId);
    if (!download) return;

    // Update download status
    activeDownloads.set(downloadId, { ...download, ...update });

    // Update notification
    chrome.notifications.update(`download_${downloadId}`, {
        progress: Math.round(update.progress || 0),
        message: update.status === 'completed'
            ? 'Download completed!'
            : `Downloading: ${download.title} (${update.progress}%)`
    });

    // If completed, add to history
    if (update.status === 'completed') {
        const historyItem = {
            id: downloadId,
            title: download.title,
            url: download.url,
            timestamp: Date.now(),
            filePath: update.fileName,
            format: download.format,
            quality: download.quality
        };

        chrome.storage.local.get('downloadHistory', (data) => {
            const history = data.downloadHistory || [];
            history.unshift(historyItem);
            // Keep only last 50 downloads
            if (history.length > 50) history.pop();
            chrome.storage.local.set({ downloadHistory: history });
        });

        // Clean up
        activeDownloads.delete(downloadId);

        // Open downloaded file
        if (update.fileName) {
            chrome.downloads.showDefaultFolder();
        }
    }
}
