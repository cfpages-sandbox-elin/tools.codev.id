/**
 * =================================================================================
 * Sitemap Discovery & Fetching Service for Cloudflare Functions
 * =================================================================================
 * This is a self-contained Cloudflare Function that takes a base domain URL
 * and attempts to discover and consolidate URLs from multiple common sitemap files.
 *
 * Endpoint: /fetch-sitemap (or your chosen route)
 */

// --- Helper Functions ---
const jsonResponse = (data, status = 200, extraHeaders = {}) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*', // Allow requests from any origin
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...extraHeaders
    };
    return new Response(JSON.stringify(data), { status, headers });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function parseSitemapXml(xmlString) {
    if (!xmlString) return [];
    const urls = new Set(); // Use a Set to handle duplicates within a single file
    const locRegex = /<loc>(.*?)<\/loc>/g;
    let match;
    while ((match = locRegex.exec(xmlString)) !== null) {
        // Basic sanitization and decoding
        const url = match[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .trim();
        if (url) {
            urls.add(url);
        }
    }
    return Array.from(urls);
}

// --- Main Request Handler ---
export async function onRequest({ request, env }) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            }
        });
    }

    if (request.method !== 'POST') {
        return jsonResponse({ success: false, error: 'Method Not Allowed' }, 405);
    }

    let requestData;
    try {
        requestData = await request.json();
    } catch (error) {
        return jsonResponse({ success: false, error: 'Invalid JSON.' }, 400);
    }

    const { baseUrl } = requestData;
    if (!baseUrl) {
        return jsonResponse({ success: false, error: 'Missing baseUrl' }, 400);
    }

    // --- Sitemap Discovery Logic ---
    const allFoundUrls = new Set();
    const checkedUrls = new Set();
    const logs = [];

    // Ensure base URL has a protocol and no trailing slash
    let domain = baseUrl.trim();
    if (!domain.startsWith('http')) {
        domain = 'https://' + domain;
    }
    domain = domain.replace(/\/$/, '');

    // Common static sitemap names to check
    const staticSitemapPaths = [
        '/sitemap.xml',
        '/sitemap_index.xml',
        '/sitemap-index.xml',
        '/post-sitemap.xml',
        '/page-sitemap.xml',
        '/sitemap-complete.xml'
    ];

    // Common numbered patterns to iterate through
    const numberedSitemapPatterns = [
        'post-sitemap',
        'sitemap'
    ];

    const fetchHeaders = {
        'User-Agent': 'Mozilla/5.0 (compatible; SitemapDiscoveryWorker/1.0; +http://www.google.com/bot.html)'
    };

    // 1. Fetch static sitemaps
    for (const path of staticSitemapPaths) {
        const url = domain + path;
        if (checkedUrls.has(url)) continue;
        checkedUrls.add(url);

        try {
            const response = await fetch(url, { headers: fetchHeaders });
            if (response.ok) {
                const xmlText = await response.text();
                const urlsFromFile = parseSitemapXml(xmlText);
                urlsFromFile.forEach(u => allFoundUrls.add(u));
                logs.push(`SUCCESS: Found ${urlsFromFile.length} URLs in ${url}`);
            } else {
                logs.push(`INFO: Checked ${url} [Status: ${response.status}]`);
            }
        } catch (error) {
            logs.push(`WARN: Failed to fetch ${url}: ${error.message}`);
        }
        await delay(50); // Be a good citizen
    }

    // 2. Fetch numbered sitemaps iteratively
    for (const pattern of numberedSitemapPatterns) {
        // Try up to 100 variations (e.g., post-sitemap1.xml to post-sitemap100.xml)
        for (let i = 1; i <= 100; i++) {
            const url = `${domain}/${pattern}${i}.xml`;
            if (checkedUrls.has(url)) continue;
            checkedUrls.add(url);

            let found = false;
            try {
                const response = await fetch(url, { headers: fetchHeaders });
                if (response.ok) {
                    const xmlText = await response.text();
                    const urlsFromFile = parseSitemapXml(xmlText);
                    urlsFromFile.forEach(u => allFoundUrls.add(u));
                    logs.push(`SUCCESS: Found ${urlsFromFile.length} URLs in ${url}`);
                    found = true;
                } else {
                    logs.push(`INFO: Checked ${url} [Status: ${response.status}], stopping search for this pattern.`);
                    break; // Stop this pattern's loop if we get a 404 or other error
                }
            } catch (error) {
                logs.push(`WARN: Failed to fetch ${url}, stopping search for this pattern. Error: ${error.message}`);
                break; // Stop on network error too
            }
            await delay(50);
        }
    }
    
    // 3. De-duplicate and filter out any nested sitemap index files
    const finalUrls = Array.from(allFoundUrls).filter(url => !url.endsWith('.xml'));

    logs.push(`Discovery complete. Found ${finalUrls.length} unique page URLs.`);
    console.log(logs.join('\n'));

    return jsonResponse({
        success: true,
        urls: finalUrls,
        log: logs // Send logs to the frontend for debugging
    });
}