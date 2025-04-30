/**
 * Cloudflare Function to securely proxy AI API calls and handle other actions.
 * Includes retry logic for API calls and GitHub uploads.
 * Endpoint: /ai-api
 * Actions: 'generate', 'check_status', 'fetch_sitemap', 'generate_image', 'upload_image'
 */

// --- Constants ---
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000; // 1 second
const RATE_LIMIT_DELAY_MS = 10000; // 10 seconds

// --- Provider Configurations ---
const textProviderConfigs = {
    google: {
        getEndpoint: (m, k) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`,
        // Increased default tokens, check specific model limits if needed
        getBody: (p, m, c=false) => ({ contents: [{ parts: [{ text: p }] }], generationConfig: { ...(c ? { maxOutputTokens: 10, temperature: 0.1 } : { maxOutputTokens: 4096 }) } }),
        getHeaders: () => ({ 'Content-Type': 'application/json' }),
        getText: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text, apiKeyEnvVar: 'GOOGLE_API_KEY', checkPrompt: "OK"
    },
    openai: {
        getEndpoint: () => `https://api.openai.com/v1/chat/completions`,
        getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 4096 }), // Increased default
        getHeaders: (k) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` }), // Corrected C-T typo
        getText: (d) => d?.choices?.[0]?.message?.content, apiKeyEnvVar: 'OPENAI_API_KEY', checkPrompt: "OK"
    },
    anthropic: {
        getEndpoint: () => `https://api.anthropic.com/v1/messages`,
        getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 4096 }), // Increased default
        getHeaders: (k) => ({ 'Content-Type': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01' }), // Corrected C-T typo
        getText: (d) => d?.content?.[0]?.text, apiKeyEnvVar: 'ANTHROPIC_API_KEY', checkPrompt: "OK"
    },
    deepseek: {
        getEndpoint: () => `https://api.deepseek.com/v1/chat/completions`,
        getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 4096 }), // Increased default
        getHeaders: (k) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` }), // Corrected C-T typo
        getText: (d) => d?.choices?.[0]?.message?.content, apiKeyEnvVar: 'DEEPSEEK_API_KEY', checkPrompt: "OK"
    },
    xai: {
        getEndpoint: () => `https://api.x.ai/v1/chat/completions`,
        getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 4096 }), // Increased default
        getHeaders: (k) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` }), // Corrected C-T typo
        getText: (d) => d?.choices?.[0]?.message?.content, apiKeyEnvVar: 'XAI_API_KEY', checkPrompt: "OK"
    }
};
const imageProviderConfigs = {
    google: { /* ... Same as v2.3 ... */ getEndpoint: (m, k) => { if (m.includes('imagen')) { return `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateImage?key=${k}`; } else if (m.includes('gemini')) { return `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`; } throw new Error(`Unsupported Google image model: ${m}`); }, getBody: (p) => { if (p.model.includes('imagen')) { return { prompt: p.prompt, ...(p.numImages && { number_of_images: p.numImages }), ...(p.aspectRatio && { aspect_ratio: p.aspectRatio }), }; } else if (p.model.includes('gemini')) { return { contents: [{ parts: [{ text: p.prompt }] }], generationConfig: { responseMimeType: "multipart/mixed" } }; } throw new Error(`Unsupported Google image model: ${p.model}`); }, getHeaders: () => ({ 'Content-Type': 'application/json' }), getImageData: (d, m) => { if (m.includes('imagen')) { return d?.generatedImages?.[0]?.image?.imageBytes; } else if (m.includes('gemini')) { return d?.candidates?.[0]?.content?.parts?.find(pt => pt.inlineData)?.inlineData?.data; } return null; }, apiKeyEnvVar: 'GOOGLE_API_KEY' },
    openai: { /* ... Same as v2.3 ... */ getEndpoint: () => `https://api.openai.com/v1/images/generations`, getBody: (p) => ({ model: p.model, prompt: p.prompt, n: p.numImages || 1, size: p.aspectRatio || "1024x1024", response_format: "b64_json" }), getHeaders: (k) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` }), getImageData: (d) => d?.data?.[0]?.b64_json, apiKeyEnvVar: 'OPENAI_API_KEY' }
};

// --- Helper Functions ---
const jsonResponse = (data, status = 200, headers = {}) => { /* ... (same) ... */ return new Response(JSON.stringify(data), { status: status, headers: { 'Content-Type': 'application/json', ...headers }, }); };
function parseSitemapXml(xmlString) { /* ... (same) ... */ const urls = []; const locRegex = /<loc>(.*?)<\/loc>/g; let match; while ((match = locRegex.exec(xmlString)) !== null) { const url = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"); urls.push(url.trim()); } return urls; }
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// --- Fetch with Retry Logic ---
async function fetchWithRetry(url, options, retryCount = 0) {
    try {
        const response = await fetch(url, options);

        // Check for specific retryable status codes
        if ([429, 500, 502, 503, 504].includes(response.status) && retryCount < MAX_RETRIES) {
            const delayTime = response.status === 429 ? RATE_LIMIT_DELAY_MS : INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url} failed with status ${response.status}. Retrying in ${delayTime}ms... (${retryCount + 1}/${MAX_RETRIES})`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        // Return the response if successful or non-retryable error
        return response;
    } catch (error) {
        // Retry on network errors
        if (retryCount < MAX_RETRIES) {
            const delayTime = INITIAL_RETRY_DELAY_MS * Math.pow(2, retryCount);
            console.warn(`Request to ${url} failed with network error: ${error.message}. Retrying in ${delayTime}ms... (${retryCount + 1}/${MAX_RETRIES})`);
            await delay(delayTime);
            return fetchWithRetry(url, options, retryCount + 1);
        }
        // Max retries reached, throw the error
        console.error(`Request to ${url} failed after ${MAX_RETRIES} retries: ${error.message}`);
        throw error;
    }
}


// --- Main Request Handler ---
export async function onRequest({ request, env }) {
    if (request.method !== 'POST') {
        return new Response(`Method ${request.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST' } });
    }

    let requestData;
    try { requestData = await request.json(); }
    catch (error) { return jsonResponse({ success: false, error: 'Invalid JSON.' }, 400); }

    const { action, providerKey, model, prompt, sitemapUrl, ...otherParams } = requestData;

    if (!action) { return jsonResponse({ success: false, error: 'Missing action.' }, 400); }

    // --- Action: fetch_sitemap ---
    if (action === 'fetch_sitemap') {
        if (!sitemapUrl) { return jsonResponse({ success: false, error: 'Missing sitemapUrl' }, 400); }
        try {
            console.log(`Fetching sitemap: ${sitemapUrl}`);
            // Use fetchWithRetry for sitemap fetching as well
            const response = await fetchWithRetry(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)' } });
            if (!response.ok) { throw new Error(`Fetch failed (${response.status}) ${response.statusText}`); }
            const xmlText = await response.text();
            const urls = parseSitemapXml(xmlText);
            // ... (rest of sitemap parsing logic same as v2.3) ...
            const finalUrls = []; const sitemapIndexUrls = urls.filter(url => url.endsWith('.xml')); const pageUrls = urls.filter(url => !url.endsWith('.xml')); finalUrls.push(...pageUrls); for (const indexUrl of sitemapIndexUrls.slice(0, 5)) { try { const indexResponse = await fetchWithRetry(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} }); if (indexResponse.ok) { const indexXmlText = await indexResponse.text(); finalUrls.push(...parseSitemapXml(indexXmlText).filter(url => !url.endsWith('.xml'))); } } catch (indexError) { console.warn(`Failed parsing index ${indexUrl}: ${indexError.message}`); } } console.log(`Parsed ${finalUrls.length} URLs from ${sitemapUrl}`); return jsonResponse({ success: true, urls: finalUrls });
        } catch (error) {
            console.error(`Sitemap Error: ${error.message}`);
            return jsonResponse({ success: false, error: `Sitemap error: ${error.message}` }, 500);
        }
    }

    // --- Actions requiring Text AI Provider ---
    if (action === 'generate' || action === 'check_status') {
        if (!providerKey || !model) { return jsonResponse({ success: false, error: `Missing providerKey/model for ${action}.` }, 400); }
        const config = textProviderConfigs[providerKey];
        if (!config) { return jsonResponse({ success: false, error: `Unsupported text provider: ${providerKey}` }, 400); }
        const apiKey = env[config.apiKeyEnvVar];
        if (!apiKey) { console.error(`API Key Env Var ${config.apiKeyEnvVar} not set.`); return jsonResponse({ success: false, error: `API key for ${providerKey} not configured.` }, 500); }

        // --- Action: check_status ---
        if (action === 'check_status') {
            const checkPrompt = config.checkPrompt || "OK";
            console.log(`Checking Text API status for ${providerKey} (${model})...`);
            try {
                const targetEndpoint = config.getEndpoint(model, apiKey);
                const checkBody = config.getBody(checkPrompt, model, true);
                const targetHeaders = config.getHeaders(apiKey);
                // Use fetchWithRetry
                const apiResponse = await fetchWithRetry(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(checkBody) });
                const responseData = await apiResponse.json();
                if (!apiResponse.ok) { const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData); throw new Error(`API Check Error (${apiResponse.status}): ${errorDetail}`); }
                console.log(`Text API Status OK for ${providerKey}`);
                return jsonResponse({ success: true, status: 'OK' });
            } catch (error) { /* ... (error handling same as v2.3) ... */ console.error(`API Status Check Error for ${providerKey}: ${error.message}`); let userError = `API Error: ${error.message}`; if (error.message.includes('401')) { userError = 'Auth failed'; } else if (error.message.includes('404')) { userError = 'Endpoint/Model not found'; } else if (error.message.includes('429')) { userError = 'Rate limit'; } else if (error.message.includes('Unknown name')) { userError = 'API structure mismatch'; } return jsonResponse({ success: false, status: 'Error', error: userError }, 500); }
        }

        // --- Action: generate (Text) ---
        if (action === 'generate') {
            if (!prompt) { return jsonResponse({ success: false, error: 'Missing prompt for generate.' }, 400); }
            console.log(`Generating text for ${providerKey} (${model})...`);
            try {
                const targetEndpoint = config.getEndpoint(model, apiKey);
                const targetBody = config.getBody(prompt, model, false);
                const targetHeaders = config.getHeaders(apiKey);
                // Use fetchWithRetry
                const apiResponse = await fetchWithRetry(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(targetBody) });
                const responseData = await apiResponse.json();
                if (!apiResponse.ok) { const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData); console.error(`API Error (${apiResponse.status}):`, errorDetail); throw new Error(`API Error (${apiResponse.status}): ${errorDetail}`); }
                const generatedText = config.getText(responseData);
                if (generatedText === undefined || generatedText === null) { console.warn(`No text found:`, responseData); throw new Error('AI returned empty/unexpected structure.'); }
                return jsonResponse({ success: true, text: generatedText });
            } catch (error) { console.error(`Generate Text Error: ${error.message}`); return jsonResponse({ success: false, error: `Generation failed: ${error.message}` }, 500); }
        }
    }

     // --- Action: generate_image ---
     if (action === 'generate_image') {
         if (!providerKey || !model || !prompt) { return jsonResponse({ success: false, error: 'Missing providerKey, model, or prompt for image generation.' }, 400); }
         const config = imageProviderConfigs[providerKey];
         if (!config) { return jsonResponse({ success: false, error: `Unsupported image provider: ${providerKey}` }, 400); }
         const apiKey = env[config.apiKeyEnvVar];
         if (!apiKey) { console.error(`API Key Env Var ${config.apiKeyEnvVar} not set for image provider ${providerKey}.`); return jsonResponse({ success: false, error: `API key for image provider ${providerKey} not configured.` }, 500); }

         console.log(`Generating image for ${providerKey} (${model})...`);
         try {
             const targetEndpoint = config.getEndpoint(model, apiKey);
             const imagePayload = { prompt, model, ...otherParams };
             const targetBody = config.getBody(imagePayload);
             const targetHeaders = config.getHeaders(apiKey);
             console.log("Image Gen Payload:", JSON.stringify(targetBody));
             // Use fetchWithRetry
             const apiResponse = await fetchWithRetry(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(targetBody) });
             const responseData = await apiResponse.json();
             if (!apiResponse.ok) { const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData); console.error(`Image API Error (${apiResponse.status}):`, errorDetail); throw new Error(`Image API Error (${apiResponse.status}): ${errorDetail}`); }
             const generatedImageData = config.getImageData(responseData, model);
             if (!generatedImageData) { console.warn(`No image data found:`, responseData); throw new Error('AI returned no image data.'); }
             return jsonResponse({ success: true, imageData: generatedImageData });
         } catch (error) { console.error(`Generate Image Error: ${error.message}`); return jsonResponse({ success: false, error: `Image generation failed: ${error.message}` }, 500); }
     }

     // --- Action: upload_image ---
     if (action === 'upload_image') {
         const { owner, repo, path, content, message } = otherParams;
         if (!owner || !repo || !path || !content || !message) {
             return jsonResponse({ success: false, error: 'Missing parameters for GitHub upload.' }, 400);
         }
         const githubToken = env.GITHUB_PAT_API_KEY;
         if (!githubToken) { console.error('GitHub PAT Error: GITHUB_PAT_API_KEY not set.'); return jsonResponse({ success: false, error: 'GitHub upload not configured.' }, 500); }

         const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
         console.log(`Uploading image to GitHub: ${githubApiUrl}`);

         try {
             // Use fetchWithRetry for GitHub upload as well
             const response = await fetchWithRetry(githubApiUrl, {
                 method: 'PUT',
                 headers: { 'Authorization': `Bearer ${githubToken}`, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'Cloudflare-Worker-AI-Tool/1.0' },
                 body: JSON.stringify({ message: message, content: content, committer: { name: 'AI Article Tool Worker', email: 'worker@example.com' } })
             });

             const responseData = await response.json();
             if (!response.ok && response.status !== 201) { console.error(`GitHub Upload Error (${response.status}):`, responseData); const errorMsg = responseData.message || JSON.stringify(responseData); throw new Error(`GitHub API Error (${response.status}): ${errorMsg}`); }

             // **Important:** GitHub API v3 Create/Update content response DOES NOT reliably return a direct download_url usable for public embedding immediately, especially for larger files processed asynchronously.
             // It returns details about the commit and the content blob.
             // We need to *construct* the likely public URL based on the repo structure and path.
             // Assuming the repo name maps to the custom domain.
             // const downloadUrl = responseData.content?.download_url; // This might be null or temporary
             const constructedUrl = `https://${repo}/${path}`; // Construct URL using repo name as domain

             if (!constructedUrl) { // Basic check
                 console.warn('Could not construct public image URL:', responseData);
                 throw new Error('Could not determine public image URL after GitHub upload.');
             }

             console.log(`GitHub Upload Successful. Constructed URL: ${constructedUrl}`);
             // Return the *constructed* URL, not the download_url from GitHub API response
             return jsonResponse({ success: true, imageUrl: constructedUrl });

         } catch (error) {
             console.error(`GitHub Upload Action Error: ${error.message}`);
             return jsonResponse({ success: false, error: `GitHub upload failed: ${error.message}` }, 500);
         }
     }


    // --- Fallback ---
    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}
