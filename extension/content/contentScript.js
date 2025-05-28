// Content script that runs on YouTube pages
(function () {
    'use strict';

    // Add download button to YouTube video pages
    function addDownloadButton() {
        // Check if we're on a video page
        if (!window.location.pathname.includes('/watch')) return;

        // Check if button already exists
        if (document.querySelector('#yt-downloader-btn')) return;

        // Find the subscribe button container
        const subscribeContainer = document.querySelector('#subscribe-button');
        if (!subscribeContainer) return;

        // Create download button
        const downloadBtn = document.createElement('button');
        downloadBtn.id = 'yt-downloader-btn';
        downloadBtn.className = 'yt-downloader-button';
        downloadBtn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
      </svg>
      <span>Download</span>
    `;

        downloadBtn.addEventListener('click', openDownloader);

        // Insert button after subscribe button
        subscribeContainer.parentNode.insertBefore(downloadBtn, subscribeContainer.nextSibling);

        // Add CSS styles
        addButtonStyles();
    }

    function addButtonStyles() {
        if (document.querySelector('#yt-downloader-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'yt-downloader-styles';
        styles.textContent = `
      .yt-downloader-button {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        margin-left: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 18px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: "Roboto", "Arial", sans-serif;
      }
      
      .yt-downloader-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      }
      
      .yt-downloader-button svg {
        width: 16px;
        height: 16px;
      }
      
      @media (max-width: 768px) {
        .yt-downloader-button span {
          display: none;
        }
        .yt-downloader-button {
          padding: 8px;
          min-width: 32px;
          justify-content: center;
        }
      }
    `;
        document.head.appendChild(styles);
    }

    function openDownloader() {
        // Send message to background script to open popup
        chrome.runtime.sendMessage({
            action: 'openDownloader',
            url: window.location.href
        });
    }

    // Extract video information for the extension
    function getVideoInfo() {
        const videoElement = document.querySelector('video');
        const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer, h1.title');
        const channelElement = document.querySelector('ytd-channel-name a, #owner-name a');
        const viewsElement = document.querySelector('.view-count, #count .view-count');
        const descriptionElement = document.querySelector('#description, #meta-contents');

        // Get video thumbnail
        let thumbnail = '';
        const videoId = new URLSearchParams(window.location.search).get('v');
        if (videoId) {
            thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
        }

        return {
            url: window.location.href,
            videoId: videoId,
            title: titleElement ? titleElement.textContent.trim() : 'Unknown Title',
            channel: channelElement ? channelElement.textContent.trim() : 'Unknown Channel',
            views: viewsElement ? viewsElement.textContent.trim() : 'Unknown Views',
            duration: videoElement ? videoElement.duration : null,
            currentTime: videoElement ? videoElement.currentTime : null,
            thumbnail: thumbnail,
            description: descriptionElement ? descriptionElement.textContent.substring(0, 200) + '...' : ''
        };
    }

    // Check if URL is a playlist
    function isPlaylistUrl() {
        return window.location.search.includes('list=');
    }

    // Extract playlist information
    function getPlaylistInfo() {
        const playlistTitle = document.querySelector('h1.ytd-playlist-header-renderer, .playlist-title');
        const playlistVideos = document.querySelectorAll('ytd-playlist-video-renderer, .playlist-video-item');

        const videos = Array.from(playlistVideos).map(video => {
            const titleElement = video.querySelector('a#video-title, .video-title');
            const durationElement = video.querySelector('.ytd-thumbnail-overlay-time-status-renderer, .video-duration');
            const thumbnailElement = video.querySelector('img');

            return {
                title: titleElement ? titleElement.textContent.trim() : 'Unknown Title',
                duration: durationElement ? durationElement.textContent.trim() : 'Unknown Duration',
                thumbnail: thumbnailElement ? thumbnailElement.src : '',
                url: titleElement ? titleElement.href : ''
            };
        });

        return {
            title: playlistTitle ? playlistTitle.textContent.trim() : 'Unknown Playlist',
            videoCount: videos.length,
            videos: videos
        };
    }

    // Listen for messages from popup or background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getVideoInfo') {
            const videoInfo = getVideoInfo();
            sendResponse({ success: true, data: videoInfo });
            return true;
        }

        if (request.action === 'getPlaylistInfo') {
            const playlistInfo = getPlaylistInfo();
            sendResponse({ success: true, data: playlistInfo });
            return true;
        }

        if (request.action === 'isPlaylist') {
            sendResponse({ isPlaylist: isPlaylistUrl() });
            return true;
        }
    });

    // Auto-fill URL in extension popup when opened
    function autoFillUrl() {
        chrome.storage.local.set({ currentUrl: window.location.href });
    }

    // Initialize content script
    function init() {
        // Add download button to video pages
        addDownloadButton();

        // Auto-fill current URL for extension
        autoFillUrl();

        // Re-run when navigating to new videos (YouTube SPA)
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Check if we navigated to a new video
                    if (window.location.pathname.includes('/watch')) {
                        setTimeout(addDownloadButton, 1000);
                    }
                }
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle URL changes in YouTube SPA
    let currentUrl = window.location.href;
    setInterval(() => {
        if (window.location.href !== currentUrl) {
            currentUrl = window.location.href;
            setTimeout(() => {
                addDownloadButton();
                autoFillUrl();
            }, 1000);
        }
    }, 1000);
})();
