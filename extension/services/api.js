// Handles API calls to the backend
export async function fetchFromBackend(endpoint, options = {}) {
    const baseUrl = 'http://localhost:3000'; // Adjust as needed
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    if (!response.ok) throw new Error('Network response was not ok');
    return response.json();
}
