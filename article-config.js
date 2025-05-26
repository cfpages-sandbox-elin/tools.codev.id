// article-config.js (v8.7 fix google model)

export const CLOUDFLARE_FUNCTION_URL = '/ai-api';

// --- AI Provider Configurations ---
export const textProviders = {
    google: { models: ['gemini-2.0-flash-lite', 'gemini-2.0-flash', 'gemini-2.0-flash-thinking-exp-01-21'] }, // Flash lite first for default
    openai: { models: ['gpt-4o-mini', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4.1'] }, // Mini/Nano first
    anthropic: { models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'] }, // Haiku first
    deepseek: { models: ['deepseek-chat', 'deepseek-coder'] }, // Assuming chat is cheaper/faster
    xai: { models: ['grok-3-mini-fast', 'grok-3-fast', 'grok-3-mini', 'grok-3'] } // Fast first
};

export const imageProviders = {
    google: {
        models: ['gemini-2.0-flash-exp-image-generation', 'imagen-3.0-generate-002'], // Gemini likely cheaper/faster default
        aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"]
    },
    openai: {
        models: ['gpt-image-1'], // Only one model listed in docs provided
        aspectRatios: ["1024x1024", "1024x1536", "1536x1024"]
    }
};

// --- Language & Dialect Options ---
export const languageOptions = {
    "English": { name: "English", dialects: ["Default", "American", "British", "Australian"], defaultPath: "/articles/" },
    "Indonesian": { name: "Indonesian", dialects: ["Default/Formal", "Jaksel", "Suroboyoan", "Medan", "Santai/Gaul"], defaultPath: "/artikel/" },
    "Spanish": { name: "Spanish", dialects: ["Default/Neutral", "Spain", "Mexican", "Argentinian"], defaultPath: "/articulos/" },
    "French": { name: "French", dialects: ["Default/Standard", "Canadian", "African"], defaultPath: "/articles-fr/" }, // Example path
    "German": { name: "German", dialects: ["Default/Standard", "Bavarian", "Swiss German"], defaultPath: "/artikel-de/" }, // Example path
    "custom": { name: "Custom...", dialects: [], defaultPath: "/articles/" }
};

// --- Storage Keys ---
export const SITEMAP_STORAGE_KEY = 'aiArticleSpinner_sitemapUrls_v1';
export const CUSTOM_MODELS_STORAGE_KEY = 'aiArticleSpinner_customModels_v1';
export const APP_STATE_STORAGE_KEY = 'aiArticleSpinner_appState_v8'; // For general settings
export const BULK_PLAN_STORAGE_KEY = 'aiArticleSpinner_bulkPlan_v8'; // For planning table
export const BULK_ARTICLES_STORAGE_KEY = 'aiArticleSpinner_bulkArticles_v8'; // For generated bulk articles

// --- Default Settings ---
export const defaultSettings = {
    textProvider: 'google',
    imageProvider: 'google',
    language: 'English',
    dialect: 'Default',
    audience: 'General Audience',
    readerName: '',
    tone: 'Informative',
    gender: '',
    age: '',
    purpose: ['Inform'], 
    purposeUrl: '',
    purposeCta: '',
    format: 'html', 
    formatSingleMode: 'html', // Add this, defaults to the main format
    sitemapUrl: '',
    customSpecs: '',
    generateImages: false,
    numImages: 1,
    imageAspectRatio: '1:1', 
    imageSubject: '',
    imageStyle: '',
    imageStyleModifiers: '',
    imageText: '',
    imageStorage: 'base64',
    githubRepoUrl: '',
    githubCustomPath: '',
    linkTypeInternal: true, 
    bulkMode: false,
    articleTitle: '',
    articleStructure: '',
    generatedArticleContent: '',
    bulkKeywordsContent: '', 
    sitemapFetchedUrl: '', 
    sitemapUrls: [], // Initialize as empty array
};

// --- Other Constants ---
export const GITHUB_API_BASE = 'https://api.github.com';

console.log("article-config.js loaded");