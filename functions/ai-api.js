/**
 * Cloudflare Function to securely proxy AI API calls and handle other actions.
 * Reads API keys from environment variables.
 * Endpoint: /ai-api
 * Expected POST body actions: 'generate', 'check_status', 'fetch_sitemap'
 */

// --- Provider Configurations ---
const providerConfigs = {
    google: {
        getEndpoint: (model, apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        // FIX: Use generationConfig for Google, remove max_tokens from main body
        getBody: (prompt, model, isCheck = false) => ({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                // Set low token limit for checks, otherwise rely on default or potentially add later
                ...(isCheck && { maxOutputTokens: 10, temperature: 0.1 })
                // Add other generationConfig params here if needed for 'generate' action
                 // temperature: 0.7, topP: 0.9, topK: 40
            }
        }),
        getHeaders: () => ({ 'Content-Type': 'application/json' }),
        getText: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text,
        apiKeyEnvVar: 'GOOGLE_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    openai: {
        getEndpoint: () => `https://api.openai.com/v1/chat/completions`,
        // FIX: Ensure max_tokens is appropriate for check vs generate
        getBody: (prompt, model, isCheck = false) => ({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: isCheck ? 5 : 2000 // Low for check, higher for generate
        }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'OPENAI_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    anthropic: {
        getEndpoint: () => `https://api.anthropic.com/v1/messages`,
        // FIX: Ensure max_tokens is appropriate for check vs generate
        getBody: (prompt, model, isCheck = false) => ({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: isCheck ? 5 : 2000
        }),
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
         // FIX: Ensure max_tokens is appropriate for check vs generate
        getBody: (prompt, model, isCheck = false) => ({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: isCheck ? 5 : 2000
        }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'DEEPSEEK_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    xai: {
        getEndpoint: () => `https://api.x.ai/v1/chat/completions`,
         // FIX: Ensure max_tokens is appropriate for check vs generate
        getBody: (prompt, model, isCheck = false) => ({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: isCheck ? 5 : 2000
        }),
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

function parseSitemapXml(xmlString) {
    const urls = [];
    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = locRegex.exec(xmlString)) !== null) {
        const url = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'");
        urls.push(url.trim());
    }
    return urls;
}


// --- Main Request Handler ---
export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
        return new Response(`Method ${request.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST' } });
    }

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
        // ... (sitemap logic remains the same)
        if (!sitemapUrl) { return jsonResponse({ success: false, error: 'Missing sitemapUrl' }, 400); }
        try {
            console.log(`Fetching sitemap: ${sitemapUrl}`);
            const response = await fetch(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} });
            if (!response.ok) { throw new Error(`Fetch failed (${response.status})`); }
            const xmlText = await response.text();
            const urls = parseSitemapXml(xmlText);
            const finalUrls = [];
            const sitemapIndexUrls = urls.filter(url => url.endsWith('.xml'));
            const pageUrls = urls.filter(url => !url.endsWith('.xml'));
            finalUrls.push(...pageUrls);
            for (const indexUrl of sitemapIndexUrls.slice(0, 5)) {
                 try {
                    const indexResponse = await fetch(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} });
                    if (indexResponse.ok) {
                        const indexXmlText = await indexResponse.text();
                        finalUrls.push(...parseSitemapXml(indexXmlText).filter(url => !url.endsWith('.xml')));
                    }
                 } catch (indexError) { console.warn(`Failed parsing index ${indexUrl}: ${indexError.message}`); }
            }
            console.log(`Parsed ${finalUrls.length} URLs from ${sitemapUrl}`);
            return jsonResponse({ success: true, urls: finalUrls });
        } catch (error) {
            console.error(`Sitemap Error: ${error.message}`);
            return jsonResponse({ success: false, error: `Sitemap error: ${error.message}` }, 500);
        }
    }

    // --- Actions requiring AI Provider ---
    if (!providerKey || !model) {
        return jsonResponse({ success: false, error: `Missing providerKey or model for action ${action}` }, 400);
    }
    const config = providerConfigs[providerKey];
    if (!config) { return jsonResponse({ success: false, error: `Unsupported provider: ${providerKey}` }, 400); }
    const apiKey = env[config.apiKeyEnvVar];
    if (!apiKey) { console.error(`API Key Env Var ${config.apiKeyEnvVar} not set.`); return jsonResponse({ success: false, error: `API key for ${providerKey} not configured.` }, 500); }

    // --- Action: check_status ---
    if (action === 'check_status') {
        const checkPrompt = config.checkPrompt || "Respond 'OK'.";
        console.log(`Checking API status for ${providerKey} (${model})...`);
        try {
            const targetEndpoint = config.getEndpoint(model, apiKey);
            // FIX: Pass true for isCheck to getBody
            const checkBody = config.getBody(checkPrompt, model, true);
            const targetHeaders = config.getHeaders(apiKey);
            const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(checkBody) });
            const responseData = await apiResponse.json(); // Attempt to parse JSON even on error
            if (!apiResponse.ok) {
                // Try to get a meaningful error message from the response body
                const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData);
                throw new Error(`API Check Error (${apiResponse.status}): ${errorDetail}`);
            }
            console.log(`API Status OK for ${providerKey}`);
            return jsonResponse({ success: true, status: 'OK' });
        } catch (error) {
            console.error(`API Status Check Error for ${providerKey}: ${error.message}`);
            let userError = `API Error: ${error.message}`;
             if (error.message.includes('401')) { userError = 'Authentication failed (Invalid API Key?)'; }
             else if (error.message.includes('404')) { userError = 'API Endpoint/Model not found'; }
             else if (error.message.includes('429')) { userError = 'Rate limit exceeded'; }
             // Specific check for the original error
             else if (error.message.includes('Unknown name') && error.message.includes('Cannot find field')) {
                 userError = 'API request structure mismatch (e.g., invalid parameter)';
             }
            return jsonResponse({ success: false, status: 'Error', error: userError }, 500); // Return 500 as the function had an issue during the check
        }
    }

    // --- Action: generate ---
    if (action === 'generate') {
        if (!prompt) { return jsonResponse({ success: false, error: 'Missing prompt for generate' }, 400); }
        console.log(`Generating content for ${providerKey} (${model})...`);
        try {
            const targetEndpoint = config.getEndpoint(model, apiKey);
            // FIX: Pass false for isCheck to getBody (or omit, default is false)
            const targetBody = config.getBody(prompt, model, false);
            const targetHeaders = config.getHeaders(apiKey);
            const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(targetBody) });
            const responseData = await apiResponse.json();
            if (!apiResponse.ok) {
                const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData);
                console.error(`API Error from ${providerKey} (${apiResponse.status}):`, errorDetail);
                throw new Error(`API Error (${apiResponse.status}): ${errorDetail}`);
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

    // --- Fallback ---
    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}
