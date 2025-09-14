// functions/sheet-api.js
export async function onRequest({ request, env }) {
  try {
    // Handle OPTIONS requests for CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptionsRequest();
    }
    
    // Get the Google Apps Script URL from the query parameters
    const url = new URL(request.url);
    const googleScriptUrl = url.searchParams.get('url');
    const endpoint = url.searchParams.get('endpoint');
    
    if (!googleScriptUrl) {
      return new Response(JSON.stringify({ error: 'Missing Google Script URL parameter' }), {
        status: 400,
        headers: corsHeaders()
      });
    }
    
    // Handle different endpoints
    if (endpoint === 'labels') {
      // Forward the request to get labels
      const labelsUrl = `${googleScriptUrl}?endpoint=getLabels`;
      const response = await fetch(labelsUrl);
      
      // Get the response data
      const responseData = await response.json();
      
      // Return the response with CORS headers
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: corsHeaders()
      });
    } else if (request.method === 'GET') {
      // Forward the GET request to Google Apps Script
      const response = await fetch(googleScriptUrl);
      
      // Get the response data
      const responseData = await response.json();
      
      // Return the response with CORS headers
      return new Response(JSON.stringify(responseData), {
        status: response.status,
        headers: corsHeaders()
      });
    } else if (request.method === 'POST') {
      // Get the request body
      const requestBody = await request.text();
      
      // Forward the POST request to Google Apps Script
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
    } else {
      // Return 405 Method Not Allowed for other HTTP methods
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders()
      });
    }
    
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