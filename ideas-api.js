import { getState } from './ideas-state.js';

/**
 * Fetches the AI provider configuration from the backend.
 * @returns {Promise<object>} The configuration object.
 */
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

/**
 * Fetches a transcript using the backend data-fetcher.
 * @param {string} videoUrl - The URL of the video.
 * @returns {Promise<object>} The transcript data { fullText, timedText }.
 */
export async function getTranscript(videoUrl) {
    const state = getState();
    const response = await fetch('/data-fetcher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: state.supadataApiKey, videoUrl }),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API returned status: ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data.content) || data.content.length === 0) {
        throw new Error('Transcript not found or is empty.');
    }
    const fullText = data.content.map(line => line.text).join(' ');
    const timedText = data.content.map(line => ({
        text: line.text,
        start: line.offset / 1000,
    }));
    return { fullText, timedText };
}

/**
 * Fetches AI analysis for a given prompt.
 * @param {string} prompt - The prompt for the AI.
 * @param {string} providerKey - The key for the AI provider (e.g., 'openrouter').
 * @param {string} modelId - The ID of the model to use.
 * @returns {Promise<object>} The AI's response.
 */
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