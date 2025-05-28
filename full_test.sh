#!/bin/bash

echo "🎬 YouTube Downloader Extension - Full Test Suite"
echo "==============================================="
echo ""

# Function to check if backend is running
check_backend() {
  echo "📡 Testing backend connection..."
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
  
  if [ "$response" = "200" ]; then
    echo "✅ Backend is running"
    return 0
  else
    echo "❌ Backend is NOT running. Starting it now..."
    
    # Try to start the backend
    cd /home/deepak/Desktop/YT-video-chrome-extension/backend
    nohup npm start > /dev/null 2>&1 &
    sleep 3
    
    # Check again
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
    if [ "$response" = "200" ]; then
      echo "✅ Backend started successfully"
      return 0
    else
      echo "❌ Failed to start backend. Please run 'cd backend && npm start' manually."
      return 1
    fi
  fi
}

# Function to test API endpoints
test_api_endpoints() {
  echo ""
  echo "🧪 Testing API endpoints..."
  
  # Test analyze endpoint
  echo ""
  echo "1️⃣ Testing analyze endpoint..."
  analyze_response=$(curl -s -X POST http://localhost:3000/analyze \
    -H "Content-Type: application/json" \
    -d '{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}')
  
  if echo "$analyze_response" | grep -q "videoId\|title"; then
    echo "✅ Analyze endpoint working"
  else
    echo "❌ Analyze endpoint failed: $analyze_response"
  fi
  
  # Test yt-dlp installation
  echo ""
  echo "2️⃣ Testing yt-dlp availability..."
  ytdlp_response=$(curl -s http://localhost:3000/health)
  
  if echo "$ytdlp_response" | grep -q "ytDlpAvailable"; then
    if echo "$ytdlp_response" | grep -q '"ytDlpAvailable":true'; then
      echo "✅ yt-dlp is already installed"
    else
      echo "Installing yt-dlp..."
      install_response=$(curl -s -X POST http://localhost:3000/install-ytdlp)
      if echo "$install_response" | grep -q "success"; then
        echo "✅ yt-dlp installed successfully"
      else
        echo "❌ Failed to install yt-dlp: $install_response"
      fi
    fi
  else
    echo "❌ Could not check yt-dlp status"
  fi

  # Test download endpoint with custom folder
  echo ""
  echo "3️⃣ Testing download endpoint (this will be quick)..."
  test_download_dir="/tmp/yt-test-downloads"
  mkdir -p "$test_download_dir"
  
  curl -s -N -X POST http://localhost:3000/download \
    -H "Content-Type: application/json" \
    -d "{\"url\":\"https://www.youtube.com/watch?v=dQw4w9WgXcQ\", \"quality\":\"360p\", \"format\":\"mp4\", \"downloadFolder\":\"$test_download_dir\"}" \
    > /dev/null 2>&1 &
  
  # Wait a moment to allow download to start
  sleep 2
  
  # Check status endpoint
  echo ""
  echo "4️⃣ Testing status endpoint..."
  status_response=$(curl -s http://localhost:3000/status)
  
  if echo "$status_response" | grep -q "downloading"; then
    echo "✅ Status endpoint working"
  else
    echo "❌ Status endpoint failed: $status_response"
  fi
  
  # Wait a bit to allow download to complete
  sleep 5
  
  # Test downloads list endpoint
  echo ""
  echo "4️⃣ Testing downloads list endpoint..."
  downloads_response=$(curl -s http://localhost:3000/downloads)
  
  if echo "$downloads_response" | grep -q "name\|path"; then
    echo "✅ Downloads list endpoint working"
  else
    echo "❌ Downloads list endpoint failed: $downloads_response"
  fi
}

# Function to validate extension files
validate_extension_files() {
  echo ""
  echo "📁 Validating extension files..."
  
  # Check required files
  required_files=(
    "manifest.json" 
    "popup.html" 
    "popup.css" 
    "popup.js" 
    "background.js" 
    "content.js" 
    "icons/icon16.png" 
    "icons/icon48.png" 
    "icons/icon128.png"
  )
  
  all_files_found=true
  
  for file in "${required_files[@]}"; do
    if [ -f "/home/deepak/Desktop/YT-video-chrome-extension/$file" ]; then
      echo "✅ Found $file"
    else
      echo "❌ Missing $file"
      all_files_found=false
    fi
  done
  
  if $all_files_found; then
    echo "✅ All extension files present"
  else
    echo "❌ Some extension files are missing"
  fi
}

# Function to check download directory
check_downloads() {
  echo ""
  echo "📂 Checking download directories..."
  
  # Check default downloads directory
  echo "Checking default downloads directory..."
  if [ -d "/home/deepak/Desktop/YT-video-chrome-extension/backend/downloads" ]; then
    echo "✅ Default downloads directory exists"
    
    # Check if any files exist
    file_count=$(ls -1 "/home/deepak/Desktop/YT-video-chrome-extension/backend/downloads/" | wc -l)
    
    if [ "$file_count" -gt 0 ]; then
      echo "✅ Found $file_count file(s) in default downloads directory"
      echo "Files:"
      ls -la "/home/deepak/Desktop/YT-video-chrome-extension/backend/downloads/"
    else
      echo "❌ No files found in default downloads directory"
    fi
  else
    echo "❌ Default downloads directory does not exist"
  fi

  # Check custom downloads directory
  echo ""
  echo "Checking custom downloads directory..."
  test_download_dir="/tmp/yt-test-downloads"
  if [ -d "$test_download_dir" ]; then
    echo "✅ Custom downloads directory exists"
    
    # Check if any files exist
    file_count=$(ls -1 "$test_download_dir/" | wc -l)
    
    if [ "$file_count" -gt 0 ]; then
      echo "✅ Found $file_count file(s) in custom downloads directory"
      echo "Files:"
      ls -la "$test_download_dir/"
    else
      echo "❌ No files found in custom downloads directory"
    fi
  else
    echo "❌ Custom downloads directory does not exist"
  fi

  # Clean up test directory if empty
  if [ -d "$test_download_dir" ] && [ ! "$(ls -A $test_download_dir)" ]; then
    rm -rf "$test_download_dir"
    echo "Cleaned up empty test directory"
  fi
}

# Run tests
check_backend && test_api_endpoints
validate_extension_files
check_downloads

echo ""
echo "🎉 Testing completed!"
echo ""
echo "To load the extension in Chrome:"
echo "1. Open Chrome browser"
echo "2. Navigate to chrome://extensions/"
echo "3. Enable \"Developer mode\" (top-right toggle)"
echo "4. Click \"Load unpacked\""
echo "5. Select folder: /home/deepak/Desktop/YT-video-chrome-extension"
echo ""
echo "💻 Once loaded, click the extension icon and test manually:"
echo "1. Paste a YouTube URL"
echo "2. Click \"Analyze URL\""
echo "3. Select quality and format"
echo "4. Click \"Start Download\""
echo "5. Verify download progress and completion"
echo ""
echo "⚠️  Remember: This extension is for educational purposes only."
echo "   Please comply with YouTube's Terms of Service and copyright laws."
