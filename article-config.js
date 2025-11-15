// article-config.js (v8.18 Humanize content)

export const CLOUDFLARE_FUNCTION_URL = '/ai-api';
export const GITHUB_API_BASE = 'https://api.github.com';

// --- Language & Dialect Options ---
export const languageOptions = {
    "English": { name: "English", dialects: ["Default", "American", "British", "Australian"], defaultPath: "/articles/" },
    "Indonesian": { name: "Indonesian", dialects: ["Default/Formal", "Jaksel", "Suroboyoan", "Medan", "Santai/Gaul"], defaultPath: "/artikel/" },
    "Spanish": { name: "Spanish", dialects: ["Default/Neutral", "Spain", "Mexican", "Argentinian"], defaultPath: "/articulos/" },
    "French": { name: "French", dialects: ["Default/Standard", "Canadian", "African"], defaultPath: "/articles-fr/" },
    "German": { name: "German", dialects: ["Default/Standard", "Bavarian", "Swiss German"], defaultPath: "/artikel-de/" },
    "custom": { name: "Custom...", dialects: [], defaultPath: "/articles/" }
};

// --- Image Providers Configuration ---
export const imageProviders = {
    google: {
        aspectRatios: ["1:1", "3:4", "4:3", "9:16", "16:9"]
    },
    openai: {
        aspectRatios: ["1024x1024", "1792x1024", "1024x1792"]
    }
};

// --- Storage Keys ---
export const storageKeys = {
    SITEMAP: 'aiArticleSpinner_sitemapUrls_v1',
    CUSTOM_MODELS: 'aiArticleSpinner_customModels_v1',
    APP_STATE: 'aiArticleSpinner_appState_v8',
    BULK_PLAN: 'aiArticleSpinner_bulkPlan_v8',
    BULK_ARTICLES: 'aiArticleSpinner_bulkArticles_v8'
};

// --- Default Application Settings ---
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
    formatSingleMode: 'html',
    sitemapUrl: '',
    customSpecs: '',
    humanizeContent: true,
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
    sitemapUrls: [],
    batchSize: 30,
};

console.log("article-config.js loaded (v8.18 Humanize content)");