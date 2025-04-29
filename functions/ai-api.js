/**
 * Cloudflare Function to securely proxy AI API calls and handle other actions.
 * Reads API keys from environment variables.
 * Endpoint: /ai-api
 * Expected POST body actions: 'generate', 'check_status', 'fetch_sitemap', 'generate_image'
 */

// --- Provider Configurations ---

// Text Generation Configs
const textProviderConfigs = {
    google: {
        getEndpoint: (model, apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        getBody: (prompt, model, isCheck = false) => ({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { ...(isCheck && { maxOutputTokens: 10, temperature: 0.1 }) }
        }),
        getHeaders: () => ({ 'Content-Type': 'application/json' }),
        getText: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text,
        apiKeyEnvVar: 'GOOGLE_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    openai: {
        getEndpoint: () => `https://api.openai.com/v1/chat/completions`,
        getBody: (prompt, model, isCheck = false) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: isCheck ? 5 : 2000 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'OPENAI_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    anthropic: {
        getEndpoint: () => `https://api.anthropic.com/v1/messages`,
        getBody: (prompt, model, isCheck = false) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: isCheck ? 5 : 2000 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }),
        getText: (data) => data?.content?.[0]?.text,
        apiKeyEnvVar: 'ANTHROPIC_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    deepseek: {
        getEndpoint: () => `https://api.deepseek.com/v1/chat/completions`,
        getBody: (prompt, model, isCheck = false) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: isCheck ? 5 : 2000 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'DEEPSEEK_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    },
    xai: {
        getEndpoint: () => `https://api.x.ai/v1/chat/completions`,
        getBody: (prompt, model, isCheck = false) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: isCheck ? 5 : 2000 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'XAI_API_KEY',
        checkPrompt: "Respond with only the word 'OK'."
    }
};

// Image Generation Configs
const imageProviderConfigs = {
    google: {
        // Assuming Imagen 3 for primary generation, Gemini Flash for text+image (needs different handling)
        getEndpoint: (model, apiKey) => {
            // NOTE: Gemini Flash image gen endpoint might be different or integrated with generateContent
            if (model.includes('imagen')) {
                 // Imagen 3 uses a different endpoint structure (adjust if needed based on final API)
                 // This might need to be more specific based on the actual Imagen 3 API endpoint.
                 // Assuming a hypothetical endpoint for now. Check official docs.
                 return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateImage?key=${apiKey}`; // Placeholder - VERIFY
            } else if (model.includes('gemini')) {
                 // Gemini Flash text+image uses generateContent
                 return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            }
            throw new Error(`Unsupported Google image model type: ${model}`);
        },
        getBody: (payload) => { // Payload contains prompt, model, numImages, aspectRatio etc.
             if (payload.model.includes('imagen')) {
                // Imagen 3 Body
                return {
                    prompt: payload.prompt,
                    // Include other Imagen 3 specific params from payload if they exist
                    ...(payload.numImages && { number_of_images: payload.numImages }), // Param name might differ
                    ...(payload.aspectRatio && { aspect_ratio: payload.aspectRatio }), // Param name might differ
                    // Add negative_prompt, seed, etc. if needed
                };
            } else if (payload.model.includes('gemini')) {
                 // Gemini Flash text+image Body
                 // Requires specific config and expects text+image output
                 return {
                     contents: [{ parts: [{ text: payload.prompt }] }], // Simple text prompt for now
                     generationConfig: {
                         responseMimeType: "multipart/mixed", // Or specific config for image modality
                         // We might need responseModalities here if using the SDK approach
                         // responseModalities: ["TEXT", "IMAGE"], // This might be SDK specific
                     }
                 };
            }
             throw new Error(`Unsupported Google image model type for getBody: ${payload.model}`);
        },
        getHeaders: () => ({ 'Content-Type': 'application/json' }),
        getImageData: (data, model) => {
            // How to extract image data depends heavily on the API response structure
             if (model.includes('imagen')) {
                 // Assuming Imagen 3 returns base64 directly (VERIFY DOCS)
                 // Example structure - adjust based on actual response
                 return data?.generatedImages?.[0]?.image?.imageBytes; // Assuming base64 string
             } else if (model.includes('gemini')) {
                 // Gemini Flash returns parts, find the image part
                 const imagePart = data?.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
                 return imagePart?.inlineData?.data; // Base64 data
             }
             return null;
        },
        apiKeyEnvVar: 'GOOGLE_API_KEY' // Reuse same key for now
    },
    openai: {
        getEndpoint: () => `https://api.openai.com/v1/images/generations`, // DALL-E endpoint
        getBody: (payload) => ({ // Payload contains prompt, model, numImages, aspectRatio etc.
            model: payload.model, // e.g., "dall-e-3" or the new "gpt-image-1" if it uses this endpoint
            prompt: payload.prompt,
            n: payload.numImages || 1,
            size: payload.aspectRatio || "1024x1024", // Map aspect ratio to size string
            response_format: "b64_json" // Get base64 data
            // Add quality, style if supported by the model/endpoint
        }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getImageData: (data) => data?.data?.[0]?.b64_json, // Base64 data
        apiKeyEnvVar: 'OPENAI_API_KEY'
    }
};


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

    const { action, providerKey, model, prompt, sitemapUrl, ...imageParams } = requestData; // Capture remaining params for image gen

    if (!action) { return jsonResponse({ success: false, error: 'Missing action.' }, 400); }

    // --- Action: fetch_sitemap ---
    if (action === 'fetch_sitemap') { /* ... (same sitemap logic as v2.1) ... */ if (!sitemapUrl) { return jsonResponse({ success: false, error: 'Missing sitemapUrl' }, 400); } try { console.log(`Fetching sitemap: ${sitemapUrl}`); const response = await fetch(sitemapUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} }); if (!response.ok) { throw new Error(`Fetch failed (${response.status})`); } const xmlText = await response.text(); const urls = parseSitemapXml(xmlText); const finalUrls = []; const sitemapIndexUrls = urls.filter(url => url.endsWith('.xml')); const pageUrls = urls.filter(url => !url.endsWith('.xml')); finalUrls.push(...pageUrls); for (const indexUrl of sitemapIndexUrls.slice(0, 5)) { try { const indexResponse = await fetch(indexUrl, { headers: { 'User-Agent': 'Mozilla/5.0 ...'} }); if (indexResponse.ok) { const indexXmlText = await indexResponse.text(); finalUrls.push(...parseSitemapXml(indexXmlText).filter(url => !url.endsWith('.xml'))); } } catch (indexError) { console.warn(`Failed parsing index ${indexUrl}: ${indexError.message}`); } } console.log(`Parsed ${finalUrls.length} URLs from ${sitemapUrl}`); return jsonResponse({ success: true, urls: finalUrls }); } catch (error) { console.error(`Sitemap Error: ${error.message}`); return jsonResponse({ success: false, error: `Sitemap error: ${error.message}` }, 500); } }

    // --- Actions requiring Text AI Provider ---
    if (action === 'generate' || action === 'check_status') {
        if (!providerKey || !model) { return jsonResponse({ success: false, error: `Missing providerKey/model for ${action}.` }, 400); }
        const config = textProviderConfigs[providerKey];
        if (!config) { return jsonResponse({ success: false, error: `Unsupported text provider: ${providerKey}` }, 400); }
        const apiKey = env[config.apiKeyEnvVar];
        if (!apiKey) { console.error(`API Key Env Var ${config.apiKeyEnvVar} not set.`); return jsonResponse({ success: false, error: `API key for ${providerKey} not configured.` }, 500); }

        // --- Action: check_status ---
        if (action === 'check_status') {
            const checkPrompt = config.checkPrompt || "Respond 'OK'.";
            console.log(`Checking Text API status for ${providerKey} (${model})...`);
            try {
                const targetEndpoint = config.getEndpoint(model, apiKey);
                const checkBody = config.getBody(checkPrompt, model, true); // Pass isCheck=true
                const targetHeaders = config.getHeaders(apiKey);
                const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(checkBody) });
                const responseData = await apiResponse.json();
                if (!apiResponse.ok) { const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData); throw new Error(`API Check Error (${apiResponse.status}): ${errorDetail}`); }
                console.log(`Text API Status OK for ${providerKey}`);
                return jsonResponse({ success: true, status: 'OK' });
            } catch (error) { /* ... (error handling same as v2.1) ... */ console.error(`API Status Check Error for ${providerKey}: ${error.message}`); let userError = `API Error: ${error.message}`; if (error.message.includes('401')) { userError = 'Auth failed (Invalid Key?)'; } else if (error.message.includes('404')) { userError = 'Endpoint/Model not found'; } else if (error.message.includes('429')) { userError = 'Rate limit'; } else if (error.message.includes('Unknown name')) { userError = 'API structure mismatch'; } return jsonResponse({ success: false, status: 'Error', error: userError }, 500); }
        }

        // --- Action: generate (Text) ---
        if (action === 'generate') {
            if (!prompt) { return jsonResponse({ success: false, error: 'Missing prompt for generate.' }, 400); }
            console.log(`Generating text for ${providerKey} (${model})...`);
            try {
                const targetEndpoint = config.getEndpoint(model, apiKey);
                const targetBody = config.getBody(prompt, model, false); // Pass isCheck=false
                const targetHeaders = config.getHeaders(apiKey);
                const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(targetBody) });
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
         const apiKey = env[config.apiKeyEnvVar]; // Assumes same env var name for now
         if (!apiKey) { console.error(`API Key Env Var ${config.apiKeyEnvVar} not set for image provider ${providerKey}.`); return jsonResponse({ success: false, error: `API key for image provider ${providerKey} not configured.` }, 500); }

         console.log(`Generating image for ${providerKey} (${model})...`);
         try {
             const targetEndpoint = config.getEndpoint(model, apiKey);
             // Pass all relevant imageParams from the request body + prompt/model
             const imagePayload = { prompt, model, ...imageParams };
             const targetBody = config.getBody(imagePayload);
             const targetHeaders = config.getHeaders(apiKey);

             console.log("Image Gen Payload:", JSON.stringify(targetBody)); // Log payload for debugging

             const apiResponse = await fetch(targetEndpoint, { method: 'POST', headers: targetHeaders, body: JSON.stringify(targetBody) });
             const responseData = await apiResponse.json();

             if (!apiResponse.ok) {
                 const errorDetail = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData);
                 console.error(`Image API Error from ${providerKey} (${apiResponse.status}):`, errorDetail);
                 throw new Error(`Image API Error (${apiResponse.status}): ${errorDetail}`);
             }

             const generatedImageData = config.getImageData(responseData, model); // Extract base64 data

             if (!generatedImageData) {
                 console.warn(`No image data found in ${providerKey} response:`, responseData);
                 throw new Error('AI returned no image data or unexpected structure.');
             }

             // Return only the first image's data for now if multiple were generated
             // Frontend requested 1-4, but we only handle inserting one placeholder per section currently.
             return jsonResponse({ success: true, imageData: generatedImageData }); // Send base64 back

         } catch (error) {
             console.error(`Generate Image Action Error for ${providerKey}: ${error.message}`);
             return jsonResponse({ success: false, error: `Image generation failed: ${error.message}` }, 500);
         }
     }


    // --- Fallback ---
    return jsonResponse({ success: false, error: `Unknown action: ${action}` }, 400);
}
