#!/bin/bash

echo "🚀 Setting up YouTube Downloader Chrome Extension..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"

# Navigate to backend directory
cd backend

echo "📦 Installing backend dependencies..."
npm install

echo "⬇️ Installing yt-dlp..."
npm run install-ytdlp

# Check if yt-dlp was installed successfully
if [ -f "./bin/yt-dlp" ]; then
    echo "✅ yt-dlp installed successfully"
    chmod +x ./bin/yt-dlp
else
    echo "❌ Failed to install yt-dlp"
    exit 1
fi

# Create downloads directory
mkdir -p downloads
echo "📁 Created downloads directory"

# Start backend server
echo ""
echo "🚀 Starting backend server..."
nohup npm start > /dev/null 2>&1 &

# Wait for server to start
echo "Waiting for server to start..."
sleep 3

# Test server connection
curl -s http://localhost:3000/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend server started successfully!"
    
    # Test yt-dlp through API
    echo "Testing yt-dlp through API..."
    response=$(curl -s http://localhost:3000/health)
    if echo "$response" | grep -q '"ytDlpAvailable":true'; then
        echo "✅ yt-dlp is working through the API"
    else
        echo "❌ yt-dlp is not accessible through the API"
        echo "Please check the backend logs for errors"
    fi
else
    echo "❌ Backend server failed to start. Please check the logs."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "To install the Chrome extension:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select this directory"
echo ""
echo "⚠️  Remember: This extension is for educational purposes only."
echo "   Please comply with YouTube's Terms of Service and copyright laws."
