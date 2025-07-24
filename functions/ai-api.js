/**
 * Cloudflare Function to securely proxy AI API calls.
 * This function is designed to be a generic proxy that uses a detailed,
 * standardized configuration file (ai-config.js) to build and parse API requests.
 *
 * Actions: 'generate', 'check_status', 'fetch_sitemap', 'generate_image', 'upload_image'
 * Endpoint: /ai-api
 */

import { aiTextProviders, aiImageProviders, aiAudioProviders, apiProviderHandlers } from './ai-config.js';

// --- Constants ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_DELAY_MS = 10000;

// --- Helper Functions ---
const jsonResponse = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function findModelConfig(providerKey, modelId, modality) {
    const providers = modality === 'image' ? aiImageProviders : aiTextProviders;
    const providerData = providers[providerKey];
    if (!providerData) return null;

    // For providers with a simple list of strings, create a minimal config
    if (Array.isArray(providerData.models) && typeof providerData.models[0] === 'string') {
        const found = providerData.models.find(id => id === modelId);
        return found ? { id: found, provider: providerKey } : null;
    }
    
    // For providers with detailed model objects
    return providerData.models.find(m => m.id === modelId) || null;
}

async function fetchWithRetry(url, options, retryCount = 0) {
    try {
        const response = await fetch(url, options);
        if ([429, 500, 502, 503, 504].includes(response.status) && retryCount < MAX_RETRIES) {
            const delayTime = response.status === 429 ? RATE_LIMIT_DELAY_MS : INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url.split('?')[0]} failed (${response.status}). Retrying in ${delayTime}ms...`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        return response;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url.split('?')[0]} failed with network error. Retrying in ${delayTime}ms...`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        console.error(`Request failed after ${MAX_RETRIES} retries: ${error.message}`);
        throw error;
    }
}

// --- Main Request Handler ---
export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
        return new Response(`Method Not Allowed`, { status: 405 });
    }

    let requestData;
    try {
        requestData = await request.json();
    } catch (error) {
        return jsonResponse({ success: false, error: 'Invalid JSON.' }, 400);
    }

    const { action, providerKey, model, prompt, ...otherParams } = requestData;

    if (!action) {
        return jsonResponse({ success: false, error: 'Missing action.' }, 400);
    }

    function parseSitemapXml(xmlString) {
        const urls = [];
        const locRegex = /<loc>(.*?)<\/loc>/g;
        let match;
        // Loop through all matches of the <loc> tag
        while ((match = locRegex.exec(xmlString)) !== null) {
            // Decode XML entities and trim whitespace
            const url = match[1]
                .replace(/&/g, '&')
                .replace(/</g, '<')
                .replace(/>/g, '>')
                .replace(/"/g, '"')
                .replace(/'/g, "'")
                .trim();
            urls.push(url);
        }
        return urls;
    }

    // --- Sitemap and GitHub actions can be inserted here ---
    if (action === 'fetch_sitemap') {
        const { sitemapUrl } = requestData;
        if (!sitemapUrl) {
            return jsonResponse({ success: false, error: 'Missing sitemapUrl' }, 400);
        }
        try {
            console.log(`Fetching sitemap: ${sitemapUrl}`);
            const response = await fetchWithRetry(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0; +http://www.google.com/bot.html)' } });

            if (!response.ok) {
                throw new Error(`Fetch failed with status ${response.status}: ${response.statusText}`);
            }

            const xmlText = await response.text();
            const allUrls = parseSitemapXml(xmlText);

            const finalUrls = allUrls.filter(url => !url.endsWith('.xml')); // Add page URLs from the main sitemap
            const sitemapIndexUrls = allUrls.filter(url => url.endsWith('.xml')); // Get sitemap index files

            // Fetch URLs from the first 5 sitemap indexes to avoid excessive requests
            for (const indexUrl of sitemapIndexUrls.slice(0, 5)) {
                try {
                    console.log(`Fetching nested sitemap index: ${indexUrl}`);
                    const indexResponse = await fetchWithRetry(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} });
                    if (indexResponse.ok) {
                        const indexXmlText = await indexResponse.text();
                        // Add page URLs from the nested sitemap, filtering out any more index files
                        finalUrls.push(...parseSitemapXml(indexXmlText).filter(url => !url.endsWith('.xml')));
                    }
                } catch (indexError) {
                    console.warn(`Failed to parse nested sitemap index ${indexUrl}: ${indexError.message}`);
                }
            }

            console.log(`Successfully parsed ${finalUrls.length} page URLs from ${sitemapUrl}`);
            return jsonResponse({ success: true, urls: finalUrls });

        } catch (error) {
            console.error(`Sitemap fetch/parse error: ${error.message}`);
            return jsonResponse({ success: false, error: `Sitemap error: ${error.message}` }, 500);
        }
    }

    if (action === 'upload_image') {
        const { owner, repo, path, content, message } = otherParams;
        if (!owner || !repo || !path || !content || !message) {
            return jsonResponse({ success: false, error: 'Missing required parameters for GitHub upload (owner, repo, path, content, message).' }, 400);
        }

        const githubToken = env.GITHUB_PAT_API_KEY;
        if (!githubToken) {
            console.error('GitHub PAT Error: GITHUB_PAT_API_KEY environment variable is not set.');
            return jsonResponse({ success: false, error: 'GitHub upload is not configured on the server.' }, 500);
        }

        const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        console.log(`Uploading image to GitHub repository: ${githubApiUrl}`);

        try {
            const response = await fetchWithRetry(githubApiUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${githubToken}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'User-Agent': 'Cloudflare-Worker-AI-Tool/1.0'
                },
                body: JSON.stringify({
                    message: message,
                    content: content, // This should be the Base64 string from the request
                    committer: {
                        name: 'AI Content Worker',
                        email: 'worker@your-domain.com' // Generic committer
                    }
                })
            });

            const responseData = await response.json();

            // GitHub returns 201 for creation, 200 for update.
            if (!response.ok) {
                const errorMsg = responseData.message || JSON.stringify(responseData);
                console.error(`GitHub Upload Error (${response.status}):`, errorMsg);
                throw new Error(`GitHub API Error (${response.status}): ${errorMsg}`);
            }

            const downloadUrl = responseData.content?.download_url;

            if (!downloadUrl) {
                console.warn('GitHub API response did not contain a download_url:', responseData);
                throw new Error('Could not determine the public image URL after a successful upload.');
            }

            console.log(`GitHub Upload Successful. Public URL: ${downloadUrl}`);
            return jsonResponse({ success: true, download_url: downloadUrl });

        } catch (error) {
            console.error(`GitHub Upload Action Failed: ${error.message}`);
            return jsonResponse({ success: false, error: `GitHub upload failed: ${error.message}` }, 500);
        }
    }


    // --- AI-related Actions ---
    if (['generate', 'check_status', 'generate_image'].includes(action)) {
        const modality = action === 'generate_image' ? 'image' : 'text';
        
        if (!providerKey || !model) {
            return jsonResponse({ success: false, error: `Missing providerKey or model for ${action}.` }, 400);
        }

        const modelConfig = findModelConfig(providerKey, model, modality);
        if (!modelConfig) {
            return jsonResponse({ success: false, error: `Model '${model}' not found for provider '${providerKey}'.` }, 404);
        }

        const handler = apiProviderHandlers[providerKey];
        if (!handler) {
            return jsonResponse({ success: false, error: `API handler not configured for provider: ${providerKey}` }, 500);
        }

        const apiKey = env[handler.apiKeyEnvVar];
        if (!apiKey) {
            console.error(`API Key Env Var ${handler.apiKeyEnvVar} not set.`);
            return jsonResponse({ success: false, error: `API key for ${providerKey} not configured on the server.` }, 500);
        }
        
        const isCheck = action === 'check_status';
        const checkPrompt = "Please respond with 'OK'."; // Standardized check prompt

        try {
            // 1. Build the request using the handler from ai-config.js
            const modalityHandler = handler[modality];
            if (!modalityHandler) return jsonResponse({ success: false, error: `${modality} generation not supported by ${providerKey}.` }, 400);

            const payload = modality === 'image' ? { prompt, ...otherParams } : (isCheck ? checkPrompt : prompt);
            const { url, options } = modalityHandler.buildRequest(modelConfig, apiKey, payload, isCheck);

            console.log(`${isCheck ? 'Checking status' : 'Generating ' + modality} for ${providerKey} (${model})...`);

            // 2. Execute the request with retry logic
            const apiResponse = await fetchWithRetry(url, options);
            const responseData = await apiResponse.json();

            if (!apiResponse.ok) {
                const errorDetail = responseData?.error?.message || JSON.stringify(responseData);
                throw new Error(`API Error (${apiResponse.status}): ${errorDetail}`);
            }
            
            // 3. Parse the response using the handler from ai-config.js
            if (isCheck) {
                console.log(`API Status OK for ${providerKey}`);
                return jsonResponse({ success: true, status: 'OK' });
            }
            
            const generatedContent = modalityHandler.parseResponse(responseData);

            if (generatedContent === undefined || generatedContent === null) {
                console.warn(`No content found in API response:`, responseData);
                throw new Error('AI returned an empty or unexpected structure.');
            }

            const responseKey = modality === 'image' ? 'imageData' : 'text';
            return jsonResponse({ success: true, [responseKey]: generatedContent });

        } catch (error) {
            console.error(`Action '${action}' Error for ${providerKey}: ${error.message}`);
            return jsonResponse({ success: false, error: `Action failed: ${error.message}` }, 500);
        }
    }

    // --- Fallback ---
    return jsonResponse({ success: false, error: `Unknown or malformed action: ${action}` }, 400);
}