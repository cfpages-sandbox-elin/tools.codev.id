export async function onRequest({ request }) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/speedyindex-proxy', ''); // Remove the function path to get the API endpoint
  const apiUrl = `https://api.speedyindex.com${path}`; // Reconstruct SpeedyIndex API URL

  // Get API Key from request headers (sent from your frontend)
  const apiKey = request.headers.get('Authorization');

  if (!apiKey) {
    return new Response("API Key is missing", { status: 400 }); // Handle missing API Key
  }

  try {
    const speedyIndexResponse = await fetch(apiUrl, {
      method: request.method, // Forward the same method (GET, POST, etc.)
      headers: {
        'Authorization': apiKey, // Forward the API key
        'Content-Type': request.headers.get('Content-Type') || 'application/json', // Forward content type if present
      },
      body: request.method !== 'GET' ? await request.blob() : null // Forward body for POST requests
    });

    // Return the response from SpeedyIndex API back to the frontend
    return new Response(speedyIndexResponse.body, {
      status: speedyIndexResponse.status,
      headers: speedyIndexResponse.headers, // Forward headers from SpeedyIndex (important for content-type, etc.)
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Proxy error", { status: 500 }); // Handle errors
  }
}
