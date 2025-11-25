// article-config.js (v9.12 new delivery)
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

// --- Keyword Scraper Configuration ---
// Updated for 5W + 2H (Added "how to")
export const keywordScraperConfig = {
    languages: {
        "en": {
            name: "English (Global)",
            code: "en",
            gl: "us",
            // Added "how to"
            questions: ["what", "who", "where", "when", "why", "how", "how to", "can", "is", "best", "top"]
        },
        "id": {
            name: "Indonesia",
            code: "id",
            gl: "id",
            // "cara" is essentially "how to". Added "apakah" (is/can).
            questions: ["apa", "siapa", "dimana", "kapan", "kenapa", "mengapa", "bagaimana", "cara", "apakah", "tips"]
        }
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
    textProviders: [{ provider: 'openai', model: 'gpt-5-mini', useCustom: false, customModel: '' }],
    imageProvider: 'google',
    imageModel: 'imagen-3.0-generate-002',
    useCustomImageModel: false,
    customImageModel: '',
    
    keyword: '',
    bulkMode: false,
    bulkKeywordsContent: '',
    language: 'English',
    customLanguage: '',
    dialect: 'Default',
    audience: 'General Audience',
    gender: '',
    age: '',
    readerName: '',
    humanizeContent: true,
    tone: 'Informative',
    customTone: '',
    purpose: ['Inform'],
    purposeUrl: '',
    purposeCta: '',
    format: 'html',
    formatSingleMode: 'html',
    sitemapUrl: '',
    customSpecs: '',
    batchSize: 30,

    generateImages: false,
    numImages: 1,
    imageAspectRatio: '1:1',
    imageSubject: '',
    imageStyle: '',
    imageStyleModifiers: '',
    imageText: '',
    imageStorage: 'base64',

    linkTypeInternal: true,
    sitemapFetchedUrl: '',
    sitemapUrls: [],
    
    articleTitle: '',
    articleStructure: '',
    generatedArticleContent: '',
    
    spinnerData: [], 
    spinnerVariationCount: 1,

    deliveryMode: 'zip',
    
    wpUrl: '',
    wpUsername: '',
    wpPassword: '',
    wpDateStart: '',
    wpDateEnd: '',
    wpStatus: 'publish',

    githubRepoUrl: '',
    githubCustomPath: '',
};

console.log("article-config.js loaded (v9.11 GScraper+)");