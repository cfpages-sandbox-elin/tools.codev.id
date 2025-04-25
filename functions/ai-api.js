/**
 * Cloudflare Function to securely proxy AI API calls.
 * Reads API keys from environment variables.
 * Endpoint: /functions/ai-api
 */

// Configuration mapping provider keys to their details and required env var name
const providerConfigs = {
    google: {
        getEndpoint: (model, apiKey) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        getBody: (prompt) => ({ contents: [{ parts: [{ text: prompt }] }] }),
        getHeaders: () => ({ 'Content-Type': 'application/json' }),
        getText: (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text,
        apiKeyEnvVar: 'GOOGLE_API_KEY'
    },
    openai: {
        getEndpoint: () => `https://api.openai.com/v1/chat/completions`,
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }), // Increased tokens slightly
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'OPENAI_API_KEY'
    },
    anthropic: {
        getEndpoint: () => `https://api.anthropic.com/v1/messages`,
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
        getHeaders: (apiKey) => ({
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
         }),
        getText: (data) => data?.content?.[0]?.text,
        apiKeyEnvVar: 'ANTHROPIC_API_KEY'
    },
    deepseek: {
        getEndpoint: () => `https://api.deepseek.com/v1/chat/completions`,
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }),
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'DEEPSEEK_API_KEY'
    },
    xai: { // Updated based on Grok docs
        getEndpoint: () => `https://api.x.ai/v1/chat/completions`, // Correct endpoint
        getBody: (prompt, model) => ({ model: model, messages: [{ role: 'user', content: prompt }], max_tokens: 2000 }),
        getHeaders: (apiKey) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }), // Standard Bearer token
        getText: (data) => data?.choices?.[0]?.message?.content,
        apiKeyEnvVar: 'XAI_API_KEY' // Assumed env var name
    }
};

// Helper to create JSON responses
const jsonResponse = (data, status = 200, headers = {}) => {
    return new Response(JSON.stringify(data), {
        status: status,
        headers: { 'Content-Type': 'application/json', ...headers },
    });
};

// Main function handler for POST requests
export async function onRequestPost({ request, env }) {
    try {
        // 1. Parse request body from frontend
        const { providerKey, model, prompt } = await request.json();

        if (!providerKey || !model || !prompt) {
            return jsonResponse({ success: false, error: 'Missing required fields: providerKey, model, prompt' }, 400);
        }

        // 2. Get provider configuration
        const config = providerConfigs[providerKey];
        if (!config) {
            return jsonResponse({ success: false, error: `Unsupported provider: ${providerKey}` }, 400);
        }

        // 3. Get API key from environment variables
        const apiKey = env[config.apiKeyEnvVar];
        if (!apiKey) {
            console.error(`API Key Error: Environment variable ${config.apiKeyEnvVar} not set for provider ${providerKey}.`);
            return jsonResponse({ success: false, error: `API key for ${providerKey} not configured on the server.` }, 500);
        }

        // 4. Prepare the actual API request details
        const targetEndpoint = config.getEndpoint(model, apiKey); // Pass apiKey only if needed by endpoint itself (like Google)
        const targetBody = config.getBody(prompt, model);
        const targetHeaders = config.getHeaders(apiKey); // Pass apiKey for header generation

        // 5. Make the call to the target AI API
        console.log(`Proxying request for ${providerKey} (${model}) to ${targetEndpoint}`);
        const apiResponse = await fetch(targetEndpoint, {
            method: 'POST',
            headers: targetHeaders,
            body: JSON.stringify(targetBody),
        });

        // 6. Handle the response from the AI API
        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            console.error(`API Error from ${providerKey} (${apiResponse.status}):`, responseData);
            // Forward the status and error message if possible
            const errorMsg = responseData?.error?.message || responseData?.msg || JSON.stringify(responseData);
            return jsonResponse({ success: false, error: `API Error (${apiResponse.status}): ${errorMsg}` }, apiResponse.status);
        }

        // 7. Extract the text content
        const generatedText = config.getText(responseData);

        if (generatedText === undefined || generatedText === null) {
             console.warn(`No text found in ${providerKey} response:`, responseData);
             return jsonResponse({ success: false, error: 'AI returned an empty or unexpected response structure.' }, 500);
        }

        // 8. Send successful response back to frontend
        return jsonResponse({ success: true, text: generatedText });

    } catch (error) {
        console.error('Cloudflare Function Error:', error);
        // Handle JSON parsing errors or other unexpected issues
        if (error instanceof SyntaxError) {
             return jsonResponse({ success: false, error: 'Invalid JSON in request body.' }, 400);
        }
        return jsonResponse({ success: false, error: `Internal Server Error: ${error.message}` }, 500);
    }
}

// Optional: Handle other methods like GET if needed, or return error
export async function onRequest({ request }) {
     if (request.method !== 'POST') {
        return new Response(`Method ${request.method} Not Allowed`, { status: 405 });
     }
     // If it's POST but doesn't match the specific handler (e.g., wrong path)
     // This shouldn't happen if the file is named ai-api.js in /functions
     return new Response('Not Found', { status: 404 });
}
