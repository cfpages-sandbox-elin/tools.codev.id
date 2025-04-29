/**
 * Cloudflare Function to securely proxy AI API calls and handle other actions.
 * Reads API keys from environment variables.
 * Endpoint: /ai-api
 * Actions: 'generate', 'check_status', 'fetch_sitemap', 'generate_image', 'upload_image'
 */

// --- Provider Configurations (Text & Image - same as v2.2) ---
const textProviderConfigs = { /* ... Same as v2.2 ... */ google: { getEndpoint: (m, k) => `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`, getBody: (p, m, c=false) => ({ contents: [{ parts: [{ text: p }] }], generationConfig: { ...(c && { maxOutputTokens: 10, temperature: 0.1 }) } }), getHeaders: () => ({ 'Content-Type': 'application/json' }), getText: (d) => d?.candidates?.[0]?.content?.parts?.[0]?.text, apiKeyEnvVar: 'GOOGLE_API_KEY', checkPrompt: "OK" }, openai: { getEndpoint: () => `https://api.openai.com/v1/chat/completions`, getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 2000 }), getHeaders: (k) => ({ 'C-T': 'application/json', 'Authorization': `Bearer ${k}` }), getText: (d) => d?.choices?.[0]?.message?.content, apiKeyEnvVar: 'OPENAI_API_KEY', checkPrompt: "OK" }, anthropic: { getEndpoint: () => `https://api.anthropic.com/v1/messages`, getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 2000 }), getHeaders: (k) => ({ 'C-T': 'application/json', 'x-api-key': k, 'anthropic-version': '2023-06-01' }), getText: (d) => d?.content?.[0]?.text, apiKeyEnvVar: 'ANTHROPIC_API_KEY', checkPrompt: "OK" }, deepseek: { getEndpoint: () => `https://api.deepseek.com/v1/chat/completions`, getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 2000 }), getHeaders: (k) => ({ 'C-T': 'application/json', 'Authorization': `Bearer ${k}` }), getText: (d) => d?.choices?.[0]?.message?.content, apiKeyEnvVar: 'DEEPSEEK_API_KEY', checkPrompt: "OK" }, xai: { getEndpoint: () => `https://api.x.ai/v1/chat/completions`, getBody: (p, m, c=false) => ({ model: m, messages: [{ role: 'user', content: p }], max_tokens: c ? 5 : 2000 }), getHeaders: (k) => ({ 'C-T': 'application/json', 'Authorization': `Bearer ${k}` }), getText: (d) => d?.choices?.[0]?.message?.content, apiKeyEnvVar: 'XAI_API_KEY', checkPrompt: "OK" } };
const imageProviderConfigs = { /* ... Same as v2.2 ... */ google: { getEndpoint: (m, k) => { if (m.includes('imagen')) { return `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateImage?key=${k}`; } else if (m.includes('gemini')) { return `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${k}`; } throw new Error(`Unsupported Google image model: ${m}`); }, getBody: (p) => { if (p.model.includes('imagen')) { return { prompt: p.prompt, ...(p.numImages && { number_of_images: p.numImages }), ...(p.aspectRatio && { aspect_ratio: p.aspectRatio }), }; } else if (p.model.includes('gemini')) { return { contents: [{ parts: [{ text: p.prompt }] }], generationConfig: { responseMimeType: "multipart/mixed" } }; } throw new Error(`Unsupported Google image model: ${p.model}`); }, getHeaders: () => ({ 'C-T': 'application/json' }), getImageData: (d, m) => { if (m.includes('imagen')) { return d?.generatedImages?.[0]?.image?.imageBytes; } else if (m.includes('gemini')) { return d?.candidates?.[0]?.content?.parts?.find(pt => pt.inlineData)?.inlineData?.data; } return null; }, apiKeyEnvVar: 'GOOGLE_API_KEY' }, openai: { getEndpoint: () => `https://api.openai.com/v1/images/generations`, getBody: (p) => ({ model: p.model, prompt: p.prompt, n: p.numImages || 1, size: p.aspectRatio || "1024x1024", response_format: "b64_json" }), getHeaders: (k) => ({ 'C-T': 'application/json', 'Authorization': `Bearer ${k}` }), getImageData: (d) => d?.data?.[0]?.b64_json, apiKeyEnvVar: 'OPENAI_API_KEY' } };

// --- Helper Functions ---
const jsonResponse = (data, status = 200, headers = {}) => { /* ... (same) ... */ return new Response(JSON.stringify(data), { status: status, headers: { 'Content-Type': 'application/json', ...headers }, }); };
function parseSitemapXml(xmlString) { /* ... (same) ... */ const urls = []; const locRegex = /<loc>(.*?)<\/loc>/g; let match; while ((match = locRegex.exec(xmlString)) !== null) { const url = match[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'"); urls.push(url.trim()); } return urls; }

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
    if (action === 'fetch_sitemap') { /* ... (same sitemap logic) ... */ if (!sitemapUrl) { return jsonResponse({ success: false, error: 'Missing sitemapUrl' }, 400); } try { console.log(`Fetching sitemap: ${sitemapUrl}`); const response = await fetch(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} }); if (!response.ok) { throw new Error(`Fetch failed (${response.status})`); } const xmlText = await response.text(); const urls = parseSitemapXml(xmlText); const finalUrls = []; const sitemapIndexUrls = urls.filter(url => url.endsWith('.xml')); const pageUrls = urls.filter(url => !url.endsWith('.xml')); finalUrls.push(...pageUrls); for (const indexUrl of sitemapIndexUrls.slice(0, 5)) { try { const indexResponse = await fetch(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} }); if (indexResponse.ok) { const indexXmlText = await indexResponse.text(); finalUrls.push(...parseSitemapXml(indexXmlText).filter(url => !url.endsWith('.xml'))); } } catch (indexError) { console.warn(`Failed parsing index ${indexUrl}: ${indexError.message}`); } } console.log(`Parsed ${finalUrls.length} URLs from ${sitemapUrl}`); return jsonResponse({ success: true, urls: finalUrls }); } catch (error) { console.error(`Sitemap Error: ${error.message}`); return jsonResponse({ success: false, error: `Sitemap error: ${error.message}` }, 500); } }

    // --- Actions requiring Text AI Provider ---
    if (action === 'generate' || action === 'check_status') {
        if (!providerKey || !model) { return jsonResponse({ success: false, error: `Missing providerKey/model for ${action}.` }, 400); }
        const config = textProviderConfigs[providerKey];
        if (!config) { return jsonResponse({ success: false, error: `Unsupported text provider: ${providerKey}` }, 400); }
        const apiKey = env[config.apiKeyEnvVar];
        if (!apiKey) { console.error(`API Key Env Var ${config.apiKeyEnvVar} not set.`); return jsonResponse({ success: false, error: `API key for ${providerKey} not configured.` }, 500); }

        // --- Action: check_status ---
        if (action === 'check_status') { /* ... (same check_status logic) ... */ const checkPrompt = config.checkPrompt || "OK"; console.log(`Checking Text API status for ${providerKey} (${model})...`); try { const targetEndpoint = config.getEndpoint(model, apiKey); const checkBody = config.getBody(checkPrompt, model, true); const targetHeaders = config.getHeaders(apiKey); const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(checkBody) }); const responseData = await apiResponse.json(); if (!apiResponse.ok) { const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData); throw new Error(`API Check Error (${apiResponse.status}): ${errorDetail}`); } console.log(`Text API Status OK for ${providerKey}`); return jsonResponse({ success: true, status: 'OK' }); } catch (error) { console.error(`API Status Check Error for ${providerKey}: ${error.message}`); let userError = `API Error: ${error.message}`; if (error.message.includes('401')) { userError = 'Auth failed'; } else if (error.message.includes('404')) { userError = 'Endpoint/Model not found'; } else if (error.message.includes('429')) { userError = 'Rate limit'; } else if (error.message.includes('Unknown name')) { userError = 'API structure mismatch'; } return jsonResponse({ success: false, status: 'Error', error: userError }, 500); } }

        // --- Action: generate (Text) ---
        if (action === 'generate') { /* ... (same generate text logic) ... */ if (!prompt) { return jsonResponse({ success: false, error: 'Missing prompt for generate.' }, 400); } console.log(`Generating text for ${providerKey} (${model})...`); try { const targetEndpoint = config.getEndpoint(model, apiKey); const targetBody = config.getBody(prompt, model, false); const targetHeaders = config.getHeaders(apiKey); const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(targetBody) }); const responseData = await apiResponse.json(); if (!apiResponse.ok) { const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData); console.error(`API Error (${apiResponse.status}):`, errorDetail); throw new Error(`API Error (${apiResponse.status}): ${errorDetail}`); } const generatedText = config.getText(responseData); if (generatedText === undefined || generatedText === null) { console.warn(`No text found:`, responseData); throw new Error('AI returned empty/unexpected structure.'); } return jsonResponse({ success: true, text: generatedText }); } catch (error) { console.error(`Generate Text Error: ${error.message}`); return jsonResponse({ success: false, error: `Generation failed: ${error.message}` }, 500); } }
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
             const imagePayload = { prompt, model, ...otherParams }; // Combine prompt/model with other params
             const targetBody = config.getBody(imagePayload);
             const targetHeaders = config.getHeaders(apiKey);
             console.log("Image Gen Payload:", JSON.stringify(targetBody));
             const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(targetBody) });
             const responseData = await apiResponse.json();
             if (!apiResponse.ok) { const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData); console.error(`Image API Error (${apiResponse.status}):`, errorDetail); throw new Error(`Image API Error (${apiResponse.status}): ${errorDetail}`); }
             const generatedImageData = config.getImageData(responseData, model);
             if (!generatedImageData) { console.warn(`No image data found:`, responseData); throw new Error('AI returned no image data.'); }
             return jsonResponse({ success: true, imageData: generatedImageData });
         } catch (error) { console.error(`Generate Image Error: ${error.message}`); return jsonResponse({ success: false, error: `Image generation failed: ${error.message}` }, 500); }
     }

     // --- Action: upload_image ---
     if (action === 'upload_image') {
         const { owner, repo, path, content, message } = otherParams; // Extract GitHub params
         if (!owner || !repo || !path || !content || !message) {
             return jsonResponse({ success: false, error: 'Missing parameters for GitHub upload (owner, repo, path, content, message).' }, 400);
         }

         const githubToken = env.GITHUB_PAT_API_KEY;
         if (!githubToken) {
             console.error('GitHub PAT Error: Environment variable GITHUB_PAT_API_KEY not set.');
             return jsonResponse({ success: false, error: 'GitHub upload not configured on the server.' }, 500);
         }

         const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
         console.log(`Uploading image to GitHub: ${githubApiUrl}`);

         try {
             const response = await fetch(githubApiUrl, {
                 method: 'PUT',
                 headers: {
                     'Authorization': `Bearer ${githubToken}`,
                     'Accept': 'application/vnd.github+json',
                     'X-GitHub-Api-Version': '2022-11-28',
                     'User-Agent': 'Cloudflare-Worker-AI-Tool/1.0' // Good practice to set User-Agent
                 },
                 body: JSON.stringify({
                     message: message,
                     content: content, // Base64 content from request
                     committer: { // Optional: Identify the committer
                         name: 'AI Article Tool Worker',
                         email: 'worker@example.com' // Use a generic email
                     }
                     // 'branch' parameter can be added if needed, defaults to main/master
                     // 'sha' parameter is needed for updating existing files, not for creating new ones
                 })
             });

             const responseData = await response.json();

             if (!response.ok && response.status !== 201) { // 201 Created, 200 OK (for update)
                 console.error(`GitHub Upload Error (${response.status}):`, responseData);
                 const errorMsg = responseData.message || JSON.stringify(responseData);
                 throw new Error(`GitHub API Error (${response.status}): ${errorMsg}`);
             }

             const downloadUrl = responseData.content?.download_url;
             if (!downloadUrl) {
                 console.warn('GitHub response OK but download_url not found:', responseData);
                 // Fallback: Construct a potential raw URL (less reliable)
                 // const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/<default_branch>/${path}`;
                 throw new Error('Could not retrieve download URL from GitHub response.');
             }

             console.log(`GitHub Upload Successful: ${downloadUrl}`);
             return jsonResponse({ success: true, imageUrl: downloadUrl });

         } catch (error) {
             console.error(`GitHub Upload Action Error: ${error.message}`);
             return jsonResponse({ success: false, error: `GitHub upload failed: ${error.message}` }, 500);
         }
     }


    // --- Fallback ---
    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}
