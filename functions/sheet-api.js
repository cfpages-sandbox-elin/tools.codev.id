// functions/sheet-api.js
export async function onRequest({ request, env }) {
  try {
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptionsRequest();
    }
    
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders()
      });
    }
    
    // Get the Google Apps Script URL from the query parameters
    const url = new URL(request.url);
    const googleScriptUrl = url.searchParams.get('url');
    
    if (!googleScriptUrl) {
      return new Response(JSON.stringify({ error: 'Missing Google Script URL parameter' }), {
        status: 400,
        headers: corsHeaders()
      });
    }
    
    // Get the request body
    const requestBody = await request.text();
    
    // Forward the request to Google Apps Script
    const response = await fetch(googleScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: requestBody
    });
    
    // Get the response data
    const responseData = await response.json();
    
    // Return the response with CORS headers
    return new Response(JSON.stringify(responseData), {
      status: response.status,
      headers: corsHeaders()
    });
    
  } catch (error) {
    console.error('Error in sheet-api function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: corsHeaders()
    });
  }
}

// Handle OPTIONS requests for CORS preflight
function handleOptionsRequest() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders()
  });
}

// CORS headers
function corsHeaders() {
  const headers = new Headers();
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return headers;
}

// Export the OPTIONS handler
export function onRequestOptions() {
  return handleOptionsRequest();
}