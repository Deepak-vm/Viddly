// Handles messages between extension components
export function handleMessage(request, sender, sendResponse) {
    // Add message handling logic here
    switch (request.type) {
        case 'DOWNLOAD_VIDEO':
            // handle download
            break;
        default:
            sendResponse({ error: 'Unknown message type' });
    }
}
