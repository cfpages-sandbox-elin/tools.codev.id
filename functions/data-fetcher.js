/**
 * =================================================================================
 * Data Fetcher v8 (Supadata Proxy)
 * =================================================================================
 * This function securely proxies requests to the Supadata.ai API.
 * It takes the API key from the request body and places it in the
 * 'x-api-key' header, keeping it hidden from the client's browser.
 *
 * Endpoint: /data-fetcher
 */

const SUPADATA_API_ENDPOINT = 'https://api.supadata.ai/v1/transcript';

export async function onRequest(context) {
  // Standard CORS preflight handler
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  // We only accept POST requests
  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const { apiKey, videoUrl } = await context.request.json();

    if (!apiKey || !videoUrl) {
      return new Response(JSON.stringify({ error: 'Missing apiKey or videoUrl in request.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Construct the target URL with query parameters.
    // Use `mode=native` to only fetch existing transcripts and save credits.
    const targetUrl = new URL(SUPADATA_API_ENDPOINT);
    targetUrl.searchParams.append('url', videoUrl);
    targetUrl.searchParams.append('mode', 'native'); 
    
    console.log(`Proxying request to Supadata for URL: ${videoUrl}`);

    // Fetch from Supadata, adding the API key to the header.
    const response = await fetch(targetUrl.toString(), {
      headers: {
        'x-api-key': apiKey,
        'User-Agent': 'Codev-Idea-Engine/2.0'
      }
    });

    // Supadata API may return 202 for async jobs, which we are not handling yet.
    // For now, we treat it as an unsupported response.
    if (response.status === 202) {
        console.warn('Supadata returned a 202 Accepted. Asynchronous jobs are not yet supported.');
        return new Response(JSON.stringify({ error: 'The video is too long and requires processing. Asynchronous fetching is not yet supported.' }), {
            status: 400, // Bad Request, as our client can't handle it.
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
    }

    // Create a new response so we can modify the headers for CORS
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Content-Type', 'application/json');

    return newResponse;

  } catch (error) {
    console.error(`[data-fetcher] A critical error occurred:`, error);
    return new Response(JSON.stringify({ error: `An internal error occurred: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}