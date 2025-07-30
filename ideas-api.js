import { getState } from './ideas-state.js';

export async function getProviderConfig() {
    const response = await fetch('/ai-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_all_providers' }),
    });
    if (!response.ok) throw new Error('Could not fetch AI provider configuration.');
    const data = await response.json();
    return data.textProviders;
}

export async function getTranscript(provider, videoUrl, videoId) {
    const state = getState();
    const apiKey = provider === 'supadata' ? state.supadataApiKey : state.rapidapiApiKey;

    const response = await fetch('/data-fetcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, videoUrl, videoId }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API for '${provider}' returned status: ${response.status}`);
    }

    const data = await response.json();
    
    // Handle different response formats from the proxy
    const contentArray = Array.isArray(data) ? data : data.content;

    if (!Array.isArray(contentArray) || contentArray.length === 0) {
        throw new Error('Transcript not found or is empty.');
    }

    const fullText = contentArray.map(line => line.text).join(' ');
    const timedText = contentArray.map(line => ({
        text: line.text,
        start: (line.offset || line.start) / 1000, // Supadata uses 'offset', RapidAPI uses 'start'
    }));

    return { fullText, timedText };
}

export async function getAiAnalysis(prompt, providerKey, modelId) {
    const response = await fetch('/ai-api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', providerKey, model: modelId, prompt }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `AI API returned status: ${response.status}`);
    }
    return response.json();
}