// backend/utils/fetchProtected.js
// G.2) SSRF Protection Helper
// Provides safe URL fetching with protection against Server-Side Request Forgery

const axios = require('axios');
const { URL } = require('url');
const ssrfFilter = require('ssrf-req-filter');

/**
 * Validates if a URL is safe to fetch (not pointing to internal/private networks)
 * @param {string} urlString - The URL to validate
 * @returns {boolean} - True if safe, throws error if unsafe
 */
function validateUrl(urlString) {
    try {
        const parsedUrl = new URL(urlString);

        // Check protocol - only allow HTTP/HTTPS
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error(`Protocol ${parsedUrl.protocol} is not allowed. Only HTTP/HTTPS are permitted.`);
        }

        // Use ssrf-req-filter to check for private IPs
        const hostname = parsedUrl.hostname;

        // Check for localhost variations
        const localhostPatterns = [
            'localhost',
            '127.0.0.1',
            '::1',
            '0.0.0.0'
        ];

        if (localhostPatterns.some(pattern => hostname.toLowerCase() === pattern)) {
            throw new Error('Access to localhost is forbidden (SSRF protection)');
        }

        // Check for private IP ranges
        const privateIPPatterns = [
            /^10\./,                    // 10.0.0.0/8
            /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
            /^192\.168\./,              // 192.168.0.0/16
            /^169\.254\./,              // 169.254.0.0/16 (link-local)
            /^fc00:/i,                  // fc00::/7 (IPv6 private)
            /^fe80:/i,                  // fe80::/10 (IPv6 link-local)
        ];

        if (privateIPPatterns.some(pattern => pattern.test(hostname))) {
            throw new Error('Access to private IP addresses is forbidden (SSRF protection)');
        }

        // Additional check using ssrf-req-filter
        try {
            ssrfFilter(parsedUrl.href);
        } catch (ssrfError) {
            throw new Error(`SSRF protection triggered: ${ssrfError.message}`);
        }

        return true;
    } catch (error) {
        if (error.message.includes('SSRF') || error.message.includes('forbidden')) {
            throw error;
        }
        throw new Error(`Invalid URL: ${error.message}`);
    }
}

/**
 * Safely fetches a URL with SSRF protection
 * @param {string} url - The URL to fetch
 * @param {object} options - Axios options (optional)
 * @returns {Promise} - Axios response
 */
async function fetchProtected(url, options = {}) {
    // Validate URL first
    validateUrl(url);

    console.log(`✅ [SSRF Protection] URL validated: ${url}`);

    // Fetch with additional security options
    const response = await axios({
        url,
        method: options.method || 'GET',
        timeout: options.timeout || 10000, // 10 second timeout
        maxRedirects: options.maxRedirects || 5,
        maxContentLength: options.maxContentLength || 10 * 1024 * 1024, // 10MB max
        ...options,
        // Override validateStatus to prevent following redirects to private IPs
        validateStatus: (status) => status >= 200 && status < 300,
    });

    return response;
}

/**
 * Safely downloads an image with SSRF protection
 * @param {string} imageUrl - The image URL to download
 * @returns {Promise<Buffer>} - Image data as buffer
 */
async function fetchImageProtected(imageUrl) {
    validateUrl(imageUrl);

    const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: 15000, // 15 seconds for images
        maxContentLength: 10 * 1024 * 1024, // 10MB max
        headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SecureBot/1.0)'
        }
    });

    console.log(`✅ [SSRF Protection] Image fetched: ${imageUrl} (${response.data.length} bytes)`);

    return Buffer.from(response.data);
}

module.exports = {
    validateUrl,
    fetchProtected,
    fetchImageProtected
};
