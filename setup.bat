@echo off
echo Setting up YouTube Downloader Chrome Extension...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

echo Node.js found: 
node --version

:: Navigate to backend directory
cd backend

echo Installing backend dependencies...
call npm install

echo Installing yt-dlp...
call npm run install-ytdlp-windows

:: Check if yt-dlp was installed successfully
if exist "bin\yt-dlp.exe" (
    echo yt-dlp installed successfully
) else (
    echo Failed to install yt-dlp
    pause
    exit /b 1
)

:: Create downloads directory
if not exist "downloads" mkdir downloads
echo Created downloads directory

echo.
echo Setup completed successfully!
echo.
echo To start the backend server:
echo   cd backend
echo   npm start
echo.
echo To install the Chrome extension:
echo 1. Open Chrome and go to chrome://extensions/
echo 2. Enable 'Developer mode'
echo 3. Click 'Load unpacked' and select this directory
echo.
echo WARNING: This extension is for educational purposes only.
echo Please comply with YouTube's Terms of Service and copyright laws.
echo.
pause
