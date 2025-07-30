/**
 * =================================================================================
 * Data Fetcher v9.1 (Multi-Provider Proxy with Version Check)
 * =================================================================================
 * This function securely proxies requests to multiple transcript providers.
 * It expects a 'provider' field in the request to determine the target API.
 *
 * Endpoint: /data-fetcher
 * Providers: 'supadata', 'rapidapi'
 */

// --- NEW: Version constant for easy checking ---
const VERSION = "9.1";

const SUPADATA_API_ENDPOINT = 'https://api.supadata.ai/v1/transcript';
const RAPIDAPI_ENDPOINT_HOST = 'https://youtube-captions-transcript-subtitles-video-combiner.p.rapidapi.com';

async function handleSupadataRequest(apiKey, videoUrl) {
    const targetUrl = new URL(SUPADATA_API_ENDPOINT);
    targetUrl.searchParams.append('url', videoUrl);
    targetUrl.searchParams.append('mode', 'native');
    console.log(`Proxying to Supadata for: ${videoUrl}`);

    const response = await fetch(targetUrl.toString(), {
        headers: { 'x-api-key': apiKey, 'User-Agent': 'Codev-Idea-Engine/2.0' }
    });

    if (response.status === 202) {
        throw new Error('The video is too long for Supadata synchronous fetching.');
    }
    return response;
}

async function handleRapidApiRequest(apiKey, videoId) {
    const targetUrl = `${RAPIDAPI_ENDPOINT_HOST}/download-json/${videoId}?language=en`;
    console.log(`Proxying to RapidAPI for videoId: ${videoId}`);

    const response = await fetch(targetUrl, {
        headers: {
            'x-rapidapi-key': apiKey,
            'x-rapidapi-host': RAPIDAPI_ENDPOINT_HOST
        }
    });

    return response;
}


export async function onRequest(context) {
  // --- NEW: Add a version check for GET requests ---
  if (context.request.method === 'GET') {
    const responseBody = {
        status: 'ok',
        version: VERSION,
        message: 'Data Fetcher is operational. Please use POST to fetch data.'
    };
    return new Response(JSON.stringify(responseBody), {
        headers: { 'Content-Type': 'application/json' }
    });
  }
    
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
    const { provider, apiKey, videoUrl, videoId } = await context.request.json();

    let apiResponse;
    if (provider === 'supadata') {
        // --- NEW: Provider-specific validation ---
        if (!apiKey || !videoUrl) {
            return new Response(JSON.stringify({ error: 'Supadata provider requires apiKey and videoUrl.' }), { status: 400 });
        }
        apiResponse = await handleSupadataRequest(apiKey, videoUrl);

    } else if (provider === 'rapidapi') {
        // --- NEW: Provider-specific validation ---
        if (!apiKey || !videoId) {
            return new Response(JSON.stringify({ error: 'RapidAPI provider requires apiKey and videoId.' }), { status: 400 });
        }
        apiResponse = await handleRapidApiRequest(apiKey, videoId);

    } else {
        return new Response(JSON.stringify({ error: `Unknown or missing provider.` }), { status: 400 });
    }

    // Check if the upstream API call failed
    if (!apiResponse.ok) {
        const errorBody = await apiResponse.text();
        console.error(`Upstream API Error (${provider}, ${apiResponse.status}): ${errorBody}`);
        return new Response(JSON.stringify({ error: `The '${provider}' API failed with status ${apiResponse.status}. Details: ${errorBody}` }), { status: apiResponse.status });
    }
    
    // We create a new response to gain control over the headers.
    const newResponse = new Response(apiResponse.body, apiResponse);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    newResponse.headers.set('Content-Type', 'application/json');

    return newResponse;

  } catch (error) {
    console.error(`[data-fetcher] A critical error occurred:`, error);
    return new Response(JSON.stringify({ error: `An internal error occurred: ${error.message}` }), { status: 500 });
  }
}