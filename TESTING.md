# YouTube Downloader Extension - Testing Guide

## Quick Test Checklist

### 1. Backend Server Test ✅
```bash
# Test if backend is running
curl http://localhost:3000/health
# Expected: {"status":"ok","message":"Backend server is running"}
```

### 2. Extension Loading Test
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (top right toggle)
4. Click "Load unpacked"
5. Select the project directory
6. Extension should appear with YouTube Downloader icon

### 3. Basic Functionality Test

#### Test URLs:
```
# Single Video (use for testing)
https://www.youtube.com/watch?v=dQw4w9WgXcQ

# Short URL format
https://youtu.be/dQw4w9WgXcQ

# Playlist (small playlist recommended for testing)
https://www.youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMt5Yp3RDMEVHLVl84
```

#### Test Steps:
1. **Popup Test**:
   - Click extension icon
   - Should show clean interface
   - Backend status should show "Backend Connected"

2. **URL Analysis Test**:
   - Paste a YouTube video URL
   - Click "Analyze URL"
   - Should show video thumbnail, title, duration
   - Quality options should appear

3. **Download Test** (Optional):
   - Select 360p quality and MP4 format
   - Click "Start Download"
   - Should show progress bar
   - Check `backend/downloads/` for downloaded file

### 4. Error Handling Test

#### Test Invalid URLs:
```
https://www.google.com/
https://www.youtube.com/
not-a-url
```
- Should show appropriate error messages

#### Test Backend Offline:
1. Stop backend server (Ctrl+C)
2. Refresh extension popup
3. Should show "Backend Offline"
4. Restart backend, should reconnect

### 5. Content Script Test
1. Go to any YouTube video page
2. Should see a "Download" button next to Subscribe
3. Button should open extension popup
4. URL should be auto-filled

## Manual Testing Scenarios

### Scenario 1: First Time User
1. Fresh Chrome profile
2. Load extension
3. Start backend
4. Test full workflow

### Scenario 2: Playlist Handling
1. Use playlist URL
2. Test "Download entire playlist" option
3. Test "Select specific videos" option
4. Verify individual video selection

### Scenario 3: Different Qualities
Test each quality setting:
- 144p, 240p, 360p, 480p, 720p, 1080p
- Audio-only: MP3, M4A

### Scenario 4: Error Recovery
1. Start download
2. Cancel mid-download
3. Start new download
4. Verify system recovers properly

## Automated Testing

### Backend API Tests
```bash
# Health check
curl http://localhost:3000/health

# Analyze video
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'

# Check status
curl http://localhost:3000/status
```

## Performance Testing

### Download Speed Test
1. Use different video qualities
2. Monitor download speeds
3. Test with multiple simultaneous requests

### Memory Usage Test
1. Monitor Chrome task manager
2. Test with large playlists
3. Check for memory leaks

## Security Testing

### Input Validation
- Test malformed URLs
- Test XSS attempts in URLs
- Test very long URLs

### Network Security
- Verify CORS restrictions
- Test localhost-only access
- Check for data leakage

## Browser Compatibility

### Chrome Versions
- Test on Chrome 88+ (Manifest V3 support)
- Test on different operating systems

### Extension Permissions
- Verify required permissions only
- Test permission prompts

## Common Issues & Solutions

### Backend Not Starting
```bash
# Check Node.js version
node --version
# Should be v14+

# Check port availability
lsof -i :3000
# Kill if occupied: kill -9 <PID>
```

### Extension Not Loading
- Check manifest.json syntax
- Verify all files present
- Check Chrome console for errors

### Downloads Failing
- Verify yt-dlp is executable: `chmod +x backend/bin/yt-dlp`
- Check yt-dlp version: `./backend/bin/yt-dlp --version`
- Update yt-dlp: `npm run install-ytdlp`

### Permission Errors
```bash
# Fix file permissions
chmod +x backend/bin/yt-dlp
chmod 755 backend/downloads/
```

## Production Readiness Checklist

- [ ] All tests pass
- [ ] Error handling works
- [ ] UI is responsive
- [ ] Icons are properly sized
- [ ] Legal disclaimers present
- [ ] Code is documented
- [ ] Security measures implemented
- [ ] Performance is acceptable

## Legal Compliance Verification

- [ ] Terms of Service disclaimer visible
- [ ] Copyright warning present
- [ ] Educational purpose statement clear
- [ ] User responsibility emphasized

---

**Note**: This extension is for educational purposes only. Always comply with YouTube's Terms of Service and applicable copyright laws.
