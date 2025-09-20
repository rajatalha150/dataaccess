/**
 * Web Scraper Middleware
 * Foundation for future web scraping functionality
 * Currently provides basic structure and placeholder methods
 */

const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs').promises;

class WebScraper {
    constructor() {
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
        this.timeout = 10000;
        this.maxRetries = 3;
    }

    /**
     * Initialize scraper with configuration
     * @param {Object} config - Scraper configuration
     */
    async initialize(config = {}) {
        this.config = {
            userAgent: config.userAgent || this.userAgent,
            timeout: config.timeout || this.timeout,
            maxRetries: config.maxRetries || this.maxRetries,
            ...config
        };
        
        console.log('Web scraper initialized with config:', this.config);
    }

    /**
     * Fetch webpage content
     * @param {string} url - URL to fetch
     * @param {Object} options - Request options
     * @returns {Promise<string>} HTML content
     */
    async fetchPage(url, options = {}) {
        try {
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': this.config.userAgent,
                    ...options.headers
                },
                timeout: this.config.timeout,
                ...options
            });

            return response.data;
        } catch (error) {
            console.error(`Error fetching page ${url}:`, error.message);
            throw new Error(`Failed to fetch page: ${error.message}`);
        }
    }

    /**
     * Parse HTML content using Cheerio
     * @param {string} html - HTML content to parse
     * @returns {CheerioAPI} Cheerio instance
     */
    parseHTML(html) {
        return cheerio.load(html);
    }

    /**
     * Extract movie metadata from various sources
     * @param {string} url - Movie page URL
     * @returns {Promise<Object>} Movie metadata
     */
    async extractMovieMetadata(url) {
        try {
            const html = await this.fetchPage(url);
            const $ = this.parseHTML(html);

            // Basic metadata extraction (to be expanded)
            const metadata = {
                title: this.extractTitle($),
                description: this.extractDescription($),
                poster: this.extractPoster($, url),
                year: this.extractYear($),
                genre: this.extractGenre($),
                rating: this.extractRating($),
                duration: this.extractDuration($),
                cast: this.extractCast($),
                director: this.extractDirector($),
                source: url,
                extractedAt: new Date().toISOString()
            };

            return metadata;
        } catch (error) {
            console.error('Error extracting movie metadata:', error);
            return null;
        }
    }

    /**
     * Extract title from page
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {string} Title
     */
    extractTitle($) {
        // Try multiple selectors for title
        const selectors = [
            'h1.title',
            'h1[data-testid="hero-title-block__title"]',
            '.titleBar h1',
            'h1',
            'title'
        ];

        for (const selector of selectors) {
            const title = $(selector).first().text().trim();
            if (title) return title;
        }

        return 'Unknown Title';
    }

    /**
     * Extract description from page
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {string} Description
     */
    extractDescription($) {
        const selectors = [
            '.plot_summary .summary_text',
            '[data-testid="plot-xl"]',
            '.overview',
            '.description',
            'meta[name="description"]'
        ];

        for (const selector of selectors) {
            let description;
            if (selector.startsWith('meta')) {
                description = $(selector).attr('content');
            } else {
                description = $(selector).first().text().trim();
            }
            if (description) return description;
        }

        return '';
    }

    /**
     * Extract poster image URL
     * @param {CheerioAPI} $ - Cheerio instance
     * @param {string} baseUrl - Base URL for relative links
     * @returns {string} Poster URL
     */
    extractPoster($, baseUrl) {
        const selectors = [
            '.poster img',
            '[data-testid="hero-media__poster"] img',
            '.movie-poster img',
            '.poster-image'
        ];

        for (const selector of selectors) {
            const poster = $(selector).attr('src') || $(selector).attr('data-src');
            if (poster) {
                return poster.startsWith('http') ? poster : new URL(poster, baseUrl).href;
            }
        }

        return '';
    }

    /**
     * Extract release year
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {number} Year
     */
    extractYear($) {
        const text = $('body').text();
        const yearMatch = text.match(/\b(19|20)\d{2}\b/);
        return yearMatch ? parseInt(yearMatch[0]) : null;
    }

    /**
     * Extract genre information
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {Array} Genres
     */
    extractGenre($) {
        const selectors = [
            '.genre',
            '[data-testid="genres"]',
            '.genres a'
        ];

        for (const selector of selectors) {
            const genres = $(selector).map((i, el) => $(el).text().trim()).get();
            if (genres.length > 0) return genres;
        }

        return [];
    }

    /**
     * Extract rating information
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {Object} Rating info
     */
    extractRating($) {
        const ratingSelectors = [
            '[data-testid="hero-rating-bar__aggregate-rating__score"]',
            '.rating-score',
            '.imdb-rating'
        ];

        for (const selector of ratingSelectors) {
            const rating = $(selector).first().text().trim();
            if (rating) {
                return {
                    score: parseFloat(rating),
                    source: 'scraped'
                };
            }
        }

        return null;
    }

    /**
     * Extract duration
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {number} Duration in minutes
     */
    extractDuration($) {
        const text = $('body').text();
        const durationMatch = text.match(/(\d+)\s*(?:min|minutes)/i);
        return durationMatch ? parseInt(durationMatch[1]) : null;
    }

    /**
     * Extract cast information
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {Array} Cast members
     */
    extractCast($) {
        const selectors = [
            '.cast-list a',
            '[data-testid="title-cast-item"]',
            '.cast .actor'
        ];

        for (const selector of selectors) {
            const cast = $(selector).map((i, el) => $(el).text().trim()).get();
            if (cast.length > 0) return cast.slice(0, 10); // Limit to 10 cast members
        }

        return [];
    }

    /**
     * Extract director information
     * @param {CheerioAPI} $ - Cheerio instance
     * @returns {string} Director name
     */
    extractDirector($) {
        const selectors = [
            '.director a',
            '[data-testid="title-pc-principal-credit"] a',
            '.crew .director'
        ];

        for (const selector of selectors) {
            const director = $(selector).first().text().trim();
            if (director) return director;
        }

        return '';
    }

    /**
     * Download and save poster image
     * @param {string} posterUrl - Poster image URL
     * @param {string} movieId - Movie ID for filename
     * @returns {Promise<string>} Local file path
     */
    async downloadPoster(posterUrl, movieId) {
        if (!posterUrl) return null;

        try {
            const response = await axios.get(posterUrl, {
                responseType: 'stream',
                timeout: this.config.timeout
            });

            const extension = path.extname(posterUrl) || '.jpg';
            const filename = `poster_${movieId}${extension}`;
            const filepath = path.join(__dirname, '../uploads/posters', filename);

            // Ensure directory exists
            await fs.mkdir(path.dirname(filepath), { recursive: true });

            // Save file
            const writer = require('fs').createWriteStream(filepath);
            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(`/uploads/posters/${filename}`));
                writer.on('error', reject);
            });
        } catch (error) {
            console.error('Error downloading poster:', error);
            return null;
        }
    }

    /**
     * Search for movies on various platforms
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>} Search results
     */
    async searchMovies(query, options = {}) {
        // Placeholder for future implementation
        console.log(`Searching for movies: ${query}`);
        
        // This would integrate with various movie databases/APIs
        const searchResults = [];
        
        // Future implementation would include:
        // - TMDB API integration
        // - IMDB scraping
        // - Other movie database APIs
        
        return searchResults;
    }

    /**
     * Validate URL before scraping
     * @param {string} url - URL to validate
     * @returns {boolean} Is valid
     */
    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Rate limiting for requests
     * @param {number} delay - Delay in milliseconds
     */
    async delay(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }
}

// Middleware function for Express
const scraperMiddleware = (req, res, next) => {
    if (!req.scraper) {
        req.scraper = new WebScraper();
    }
    next();
};

// Export scraper class and middleware
module.exports = {
    WebScraper,
    scraperMiddleware
};