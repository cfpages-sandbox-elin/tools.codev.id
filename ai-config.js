// --- AI Provider Configurations ---
export const aiTextProviders = {
    google: { models: ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-thinking-exp-01-21'] }, // Flash lite first for default
    openai: { models: ['gpt-4o-mini', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4.1'] }, // Mini/Nano first
    anthropic: { models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'] }, // Haiku first
    deepseek: { models: ['deepseek-chat', 'deepseek-coder'] }, // Assuming chat is cheaper/faster
    xai: { models: ['grok-3-mini-fast', 'grok-3-fast', 'grok-3-mini', 'grok-3'] } // Fast first
};

export const aiImageProviders = {
    google: {
        models: ['gemini-2.0-flash-exp-image-generation', 'imagen-3.0-generate-002'], // Gemini likely cheaper/faster default
        aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"]
    },
    openai: {
        models: ['gpt-image-1'], // Only one model listed in docs provided
        aspectRatios: ["1024x1024", "1024x1536", "1536x1024"]
    }
};