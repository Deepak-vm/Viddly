# Viddly

A powerful Chrome extension that enables users to download YouTube videos and playlists with advanced quality selection, real-time progress tracking, and comprehensive playlist management.

## Features

### Core Features
- **Smart URL Analysis**: Automatically detects video or playlist content
- **Quality Selection**: Choose from 144p, 240p, 360p, 480p, 720p, 1080p
- **Audio Download**: Download audio-only (MP3, M4A formats)
- **Playlist Support**: Download entire playlists or select specific videos
- **Real-time Progress**: Live download progress with speed indicators
- **Cancel/Resume**: Full control over download operations
- **Download History**: Track and manage previous downloads

### User Interface
- **Modern Design**: Clean, responsive interface with dark/light theme support
- **Live Connection Status**: Real-time backend server connection monitoring
- **Video Previews**: Thumbnails and metadata for videos/playlists
- **Progress Visualization**: Animated progress bars with percentage and speed
- **Folder Selection**: Choose custom download directories
- **Notification System**: Chrome notifications for download status

### Technical Features
- **Streaming Downloads**: Real-time progress updates via Server-Sent Events
- **Background Processing**: Downloads continue even when popup is closed
- **Error Handling**: Comprehensive error reporting and recovery
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Content Script Integration**: Direct download buttons on YouTube pages

## Installation

### Automated Setup (Recommended)

**For Linux/macOS:**
```bash
chmod +x setup.sh
./setup.sh
```

**For Windows:**
```batch
setup.bat
```

### Manual Setup

#### Prerequisites
- Node.js (v14 or higher)
- Chrome browser
- Git (for cloning)

#### Backend Setup

1. **Clone and navigate:**
```bash
git clone <repository-url>
cd youtube-video-downloader/backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Install yt-dlp:**
```bash
# Linux/macOS
npm run install-ytdlp

# Windows
npm run install-ytdlp-windows
```

4. **Start the backend server:**
```bash
npm start
```

The backend runs on `http://localhost:3000`

#### Chrome Extension Setup

1. Open Chrome → `chrome://extensions/`
2. Enable **"Developer mode"** (top right toggle)
3. Click **"Load unpacked"**
4. Select the entire project directory
5. Extension appears in toolbar

## Usage

### Video Download
1. **Navigate** to any YouTube video
2. **Click** the Viddly extension icon or use the download button on the page
3. **Analyze** - URL is auto-filled, click "Analyze URL"
4. **Configure** - Select quality, format, and download folder
5. **Download** - Click "Start Download" and monitor progress

### Playlist Download
1. **Open** any YouTube playlist
2. **Analyze** the playlist URL
3. **Select Videos** - Choose "Select All" or individual videos
4. **Configure** quality and format settings
5. **Download** - Start and track progress for each video

### Advanced Features
- **Custom Folders**: Click folder icon to choose download location
- **Background Downloads**: Close popup while downloads continue
- **Download History**: View and manage previous downloads
- **Real-time Monitoring**: Track speed, progress, and ETA

## Project Structure

```
youtube-video-downloader/
├── extension/                 # Chrome extension files
│   ├── manifest.json         # Extension manifest (v3)
│   ├── popup/
│   │   ├── popup.html        # Main popup interface
│   │   ├── popup.css         # Styling with theme support
│   │   └── popup.js          # Popup logic and API calls
│   ├── background/
│   │   └── background.js     # Service worker for notifications
│   ├── content/
│   │   └── contentScript.js  # YouTube page integration
│   ├── services/
│   │   └── api.js           # Backend API communication
│   └── icons/               # Extension icons (16, 48, 128px)
├── backend/                  # Node.js backend server
│   ├── server.js            # Express server with streaming
│   ├── package.json         # Dependencies and scripts
│   ├── utils/
│   │   └── validateUrl.js   # URL validation utilities
│   ├── bin/                 # yt-dlp binary location
│   └── downloads/           # Default download directory
├── setup.sh                 # Linux/macOS setup script
├── setup.bat                # Windows setup script
└── .gitignore               # Git ignore rules
```

## API Endpoints

### Backend Server (`http://localhost:3000`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check with yt-dlp status |
| `POST` | `/analyze` | Analyze YouTube URL (video/playlist) |
| `POST` | `/download` | Start download with streaming progress |
| `POST` | `/cancel` | Cancel active download |
| `GET` | `/status` | Get current download status |
| `GET` | `/downloads` | List downloaded files |

### Download Request Format
```json
{
  "url": "https://youtube.com/watch?v=...",
  "quality": "720p",
  "format": "mp4",
  "downloadFolder": "/path/to/folder",
  "selectedIds": ["video1", "video2"]  // For playlists
}
```

## Configuration

### Quality Options
- **144p** - Minimum quality, smallest files
- **240p** - Low quality for slow connections
- **360p** - Standard definition
- **480p** - Enhanced definition
- **720p** - HD quality (recommended)
- **1080p** - Full HD (largest files)

### Format Support
- **MP4** - Standard video format (recommended)
- **WebM** - Alternative video format
- **MP3** - Audio only, universal compatibility
- **M4A** - High-quality audio format

### Download Locations
- **Default**: `backend/downloads/`
- **Custom**: Use folder picker in extension
- **Auto-naming**: `%(title)s.%(ext)s` format

## Features in Detail

### Real-time Progress Tracking
- Live percentage updates
- Download speed monitoring
- ETA calculations
- Visual progress bars

### Playlist Management
- Analyze entire playlists
- Individual video selection
- Batch download operations
- Progress tracking per video

### Theme Support
- Automatic dark/light mode detection
- Consistent styling across all components
- Accessible color schemes

### Notification System
- Chrome desktop notifications
- Download start/complete alerts
- Error notifications
- Progress updates in badge

## Security & Compliance

### Security Features
- **CORS Protection**: Restricted to localhost only
- **Input Validation**: All URLs and parameters validated
- **No Data Collection**: No user data stored or transmitted
- **Local Processing**: All downloads handled locally


## Troubleshooting

### Connection Issues
```bash
# Check backend status
curl http://localhost:3000/health

# Restart backend
cd backend && npm start

# Check yt-dlp installation
ls backend/bin/yt-dlp*
```

### Common Problems

| Issue | Solution |
|-------|----------|
| Backend offline | Run `npm start` in backend directory |
| yt-dlp missing | Run `npm run install-ytdlp` |
| Download fails | Check URL validity and internet connection |
| Extension not loading | Enable Developer mode, reload extension |
| Progress not updating | Check browser console for errors |

### Debug Mode
Enable in browser console:
```javascript
// In extension popup
localStorage.setItem('viddly_debug', 'true');
```

## Development

### Local Development
```bash
# Watch for changes
cd backend && npm run dev

# Extension development
# Chrome DevTools → Extensions → Inspect views
```

### Adding Features
1. **Frontend**: Modify files in `extension/`
2. **Backend**: Update `backend/server.js`
3. **Styling**: Edit `extension/popup/popup.css`
4. **API**: Extend endpoints in server



## Dependencies

### Backend
```json
{
  "express": "^4.18.0",
  "cors": "^2.8.5",
  "dotenv": "^16.0.0",
  "child_process": "native"
}
```

### Extension
- Chrome Extension APIs (Manifest V3)
- Modern JavaScript (ES2020+)
- Fetch API with streaming support
- Chrome Storage API

## Browser Support
- ✅ Chrome (v88+)
- ✅ Chromium-based browsers
- ✅ Microsoft Edge
- ❌ Firefox (different extension format)

## Performance
- **Concurrent Downloads**: Single download at a time
- **Memory Usage**: Minimal, streaming-based
- **Storage**: Downloads only, no unnecessary data
- **CPU**: Low impact background processing

