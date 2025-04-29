/**
 * Cloudflare Function to securely proxy AI API calls and handle other actions.
 * Reads API keys from environment variables.
 * Endpoint: /functions/ai-api
 * Expected POST body actions: 'generate', 'check_status', 'fetch_sitemap'
 */

// --- Provider Configurations (Same as before) ---
const providerConfigs = {
    google: {
        getEndpoint: (model, apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        getBody: (prompt) => ({ contents: [{ parts: [{ text: prompt }] }] }),
        getHeaders: () => ({ 'Content-Type': 'application/json' }),
        getText: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text,
        apiKeyEnvVar: 'GOOGLE_API_KEY',
        checkPrompt: "Respond with only the word 'OK'." // Minimal prompt for status check
    },
    openai: {
        getEndpoint: () => `https://api.openai.com/v1/chat/completions`,
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 5 }), // Low tokens for check
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'OPENAI_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    anthropic: {
        getEndpoint: () => `https://api.anthropic.com/v1/messages`,
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 5 }),
        getHeaders: (apiKey) => ({
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
         }),
        getText: (data) => data?.content?.[0]?.text,
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    deepseek: {
        getEndpoint: () => `https://api.deepseek.com/v1/chat/completions`,
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 5 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'DEEPSEEK_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    xai: {
        getEndpoint: () => `https://api.x.ai/v1/chat/completions`,
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 5 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'XAI_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    }
};

// --- Helper Functions ---
const jsonResponse = (data, status = 200, headers = {}) => {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
};

// Simple XML Parser for Sitemaps (extracts <loc> tags)
// Handles basic sitemapindex and urlset formats
function parseSitemapXml(xmlString) {
    const urls = [];
    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = locRegex.exec(xmlString)) !== null) {
        // Basic sanitization/decoding - might need improvement for complex cases
        const url = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        urls.push(url.trim());
    }
    return urls;
}


// --- Main Request Handler ---
export async function onRequestPost({ request, env }) {
    let requestData;
    try {
        requestData = await request.json();
    } catch (error) {
        return jsonResponse({ success: false, error: 'Invalid JSON in request body.' }, 400);
    }

    const { action, providerKey, model, prompt, sitemapUrl } = requestData;

    if (!action) {
        return jsonResponse({ success: false, error: 'Missing required field: action' }, 400);
    }

    // --- Action: fetch_sitemap ---
    if (action === 'fetch_sitemap') {
        if (!sitemapUrl) {
            return jsonResponse({ success: false, error: 'Missing required field for fetch_sitemap: sitemapUrl' }, 400);
        }
        try {
            console.log(`Fetching sitemap: ${sitemapUrl}`);
            // Important: Add User-Agent, some servers block requests without one
            const response = await fetch(sitemapUrl, {
                 headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0; +http://www.cloudflare.com)'
                 }
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch sitemap (${response.status}): ${response.statusText}`);
            }
            const xmlText = await response.text();
            const urls = parseSitemapXml(xmlText);

            // Handle potential sitemap index files recursively (basic implementation)
            const finalUrls = [];
            const sitemapIndexUrls = urls.filter(url => url.endsWith('.xml'));
            const pageUrls = urls.filter(url => !url.endsWith('.xml'));
            finalUrls.push(...pageUrls);

            // Fetch URLs from sitemap index files (limit recursion depth for safety)
            // Note: This simple version doesn't handle nested indexes robustly
            for (const indexUrl of sitemapIndexUrls.slice(0, 5)) { // Limit to fetching 5 index files
                 try {
                    console.log(`Fetching sitemap index item: ${indexUrl}`);
                    const indexResponse = await fetch(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} });
                    if (indexResponse.ok) {
                        const indexXmlText = await indexResponse.text();
                        finalUrls.push(...parseSitemapXml(indexXmlText).filter(url => !url.endsWith('.xml')));
                    }
                 } catch (indexError) {
                     console.warn(`Failed to fetch or parse sitemap index item ${indexUrl}: ${indexError.message}`);
                 }
            }


            console.log(`Parsed ${finalUrls.length} URLs from ${sitemapUrl}`);
            return jsonResponse({ success: true, urls: finalUrls });
        } catch (error) {
            console.error(`Sitemap Fetch Error: ${error.message}`);
            return jsonResponse({ success: false, error: `Failed to fetch or parse sitemap: ${error.message}` }, 500);
        }
    }

    // --- Actions requiring AI Provider ('generate', 'check_status') ---
    if (!providerKey || !model) {
        return jsonResponse({ success: false, error: `Missing required fields for action ${action}: providerKey, model` }, 400);
    }

    const config = providerConfigs[providerKey];
    if (!config) {
        return jsonResponse({ success: false, error: `Unsupported provider: ${providerKey}` }, 400);
    }

    const apiKey = env[config.apiKeyEnvVar];
    if (!apiKey) {
        console.error(`API Key Error: Environment variable ${config.apiKeyEnvVar} not set for provider ${providerKey}.`);
        return jsonResponse({ success: false, error: `API key for ${providerKey} not configured on the server.` }, 500);
    }

    // --- Action: check_status ---
    if (action === 'check_status') {
        const checkPrompt = config.checkPrompt || "Respond with only the word 'OK'."; // Use provider specific or default
        console.log(`Checking API status for ${providerKey} (${model})...`);
        try {
            const targetEndpoint = config.getEndpoint(model, apiKey);
            // Use a body specifically for checking, often smaller/simpler
            const checkBody = config.getBody(checkPrompt, model);
            // Ensure low max_tokens for checks if not already set in getBody
             if (checkBody.max_tokens && checkBody.max_tokens > 10) checkBody.max_tokens = 10;
             else if (!checkBody.max_tokens) checkBody.max_tokens = 10; // Add if missing

            const targetHeaders = config.getHeaders(apiKey);

            const apiResponse = await fetch(targetEndpoint, {
                method: 'POST',
                headers: targetHeaders,
                body: JSON.stringify(checkBody),
            });

            const responseData = await apiResponse.json(); // Try to parse even on error

            if (!apiResponse.ok) {
                 const errorMsg = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData);
                throw new Error(`API Check Error (${apiResponse.status}): ${errorMsg}`);
            }

            // Optional: Check if response is roughly what was expected
            // const responseText = config.getText(responseData);
            // if (!responseText || !responseText.trim().includes('OK')) {
            //    console.warn(`API Check for ${providerKey} returned unexpected text: ${responseText}`);
            // }

            console.log(`API Status OK for ${providerKey}`);
            return jsonResponse({ success: true, status: 'OK' });

        } catch (error) {
            console.error(`API Status Check Error for ${providerKey}: ${error.message}`);
            // Provide a more specific error if possible
            let userError = `API Error: ${error.message}`;
             if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                 userError = 'Authentication failed (Invalid API Key?)';
             } else if (error.message.includes('404') || error.message.includes('Not Found')) {
                 userError = 'API Endpoint/Model not found';
             } else if (error.message.includes('rate limit') || error.message.includes('429')) {
                 userError = 'Rate limit exceeded';
             }
            return jsonResponse({ success: false, status: 'Error', error: userError }, 500);
        }
    }

    // --- Action: generate ---
    if (action === 'generate') {
        if (!prompt) {
            return jsonResponse({ success: false, error: 'Missing required field for generate: prompt' }, 400);
        }
        console.log(`Generating content for ${providerKey} (${model})...`);
        try {
            const targetEndpoint = config.getEndpoint(model, apiKey);
            const targetBody = config.getBody(prompt, model);
            const targetHeaders = config.getHeaders(apiKey);

            const apiResponse = await fetch(targetEndpoint, {
                method: 'POST',
                headers: targetHeaders,
                body: JSON.stringify(targetBody),
            });

            const responseData = await apiResponse.json();

            if (!apiResponse.ok) {
                console.error(`API Error from ${providerKey} (${apiResponse.status}):`, responseData);
                const errorMsg = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData);
                throw new Error(`API Error (${apiResponse.status}): ${errorMsg}`);
            }

            const generatedText = config.getText(responseData);

            if (generatedText === undefined || generatedText === null) {
                 console.warn(`No text found in ${providerKey} response:`, responseData);
                 throw new Error('AI returned an empty or unexpected response structure.');
            }

            return jsonResponse({ success: true, text: generatedText });

        } catch (error) {
            console.error(`Generate Action Error for ${providerKey}: ${error.message}`);
             return jsonResponse({ success: false, error: `Generation failed: ${error.message}` }, 500);
        }
    }

    // --- Fallback for unknown actions ---
    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}

// Handle non-POST requests
export async function onRequest({ request }) {
     if (request.method !== 'POST') {
        return new Response(`Method ${request.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST' } });
     }
     // Should be handled by onRequestPost, but as a fallback:
     return new Response('Not Found', { status: 404 });
}
