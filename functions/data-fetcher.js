/**
 * =================================================================================
 * Data Fetcher v9.2 (Multi-Provider Proxy with URL Scraping)
 * =================================================================================
 * This function securely proxies requests to multiple data providers, now
 * including a URL scraper.
 *
 * Endpoint: /data-fetcher
 * Providers: 'supadata', 'rapidapi', 'url_scraper'
 */

const VERSION = "9.2";

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

async function handleScraperRequest(url) {
    console.log(`Scraping text from URL: ${url}`);
    
    // Fetch the HTML content from the target URL
    const response = await fetch(url, {
        headers: {
            // A realistic User-Agent can help avoid being blocked by some sites
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch URL with status: ${response.status}`);
    }

    let textContent = '';

    // Use HTMLRewriter to parse the HTML stream and extract text
    const rewriter = new HTMLRewriter()
        .on('p, h1, h2, h3, h4, h5, h6, li, article, main', {
            // This handler is called for each chunk of text within the specified elements
            text(text) {
                // Append the text chunk, cleaning up whitespace.
                textContent += text.text.trim();
                // If it's the last text chunk in its element, add a space for separation.
                if (text.lastInTextNode) {
                    textContent += ' ';
                }
            }
        });
    
    // Transform the response through the rewriter and wait for it to finish.
    await rewriter.transform(response).text();

    return textContent.trim();
}

export async function onRequest(context) {
  if (context.request.method === 'GET') {
    return new Response(JSON.stringify({
        status: 'ok',
        version: VERSION,
        message: 'Data Fetcher is operational. Please use POST to fetch data.'
    }), {
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

  if (context.request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await context.request.json();
    const { provider, apiKey, videoUrl, videoId, url } = body;

    let responseBody;
    let apiResponse;

    if (provider === 'supadata') {
        if (!apiKey || !videoUrl) {
            return new Response(JSON.stringify({ error: 'Supadata provider requires apiKey and videoUrl.' }), { status: 400 });
        }
        apiResponse = await handleSupadataRequest(apiKey, videoUrl);

    } else if (provider === 'rapidapi') {
        if (!apiKey || !videoId) {
            return new Response(JSON.stringify({ error: 'RapidAPI provider requires apiKey and videoId.' }), { status: 400 });
        }
        apiResponse = await handleRapidApiRequest(apiKey, videoId);

    } else if (provider === 'url_scraper') {
        // --- NEW: Logic for the URL scraper provider ---
        if (!url) {
            return new Response(JSON.stringify({ error: 'url_scraper provider requires a url.' }), { status: 400 });
        }
        const extractedText = await handleScraperRequest(url);
        // We directly create the response body here, no upstream API call needed
        responseBody = { text: extractedText };

    } else {
        return new Response(JSON.stringify({ error: `Unknown or missing provider.` }), { status: 400 });
    }

    let finalResponse;
    if (responseBody) {
        // This path is for the scraper which builds its own response
        finalResponse = new Response(JSON.stringify(responseBody), {
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } else {
        // This path is for proxied APIs (Supadata, RapidAPI)
        if (!apiResponse.ok) {
            const errorBody = await apiResponse.text();
            console.error(`Upstream API Error (${provider}, ${apiResponse.status}): ${errorBody}`);
            return new Response(JSON.stringify({ error: `The '${provider}' API failed with status ${apiResponse.status}. Details: ${errorBody}` }), { status: apiResponse.status });
        }
        finalResponse = new Response(apiResponse.body, apiResponse);
        finalResponse.headers.set('Access-Control-Allow-Origin', '*');
        finalResponse.headers.set('Content-Type', 'application/json');
    }

    return finalResponse;

  } catch (error) {
    console.error(`[data-fetcher] A critical error occurred:`, error);
    return new Response(JSON.stringify({ error: `An internal error occurred: ${error.message}` }), { status: 500 });
  }
}