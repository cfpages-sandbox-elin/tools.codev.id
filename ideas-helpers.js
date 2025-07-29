/**
 * ideas-helpers.js
 * 
 * Contains reusable utility functions for the application.
 */

/**
 * Extracts the YouTube video ID from various URL formats.
 * @param {string} url - The YouTube URL.
 * @returns {string|null} The 11-character video ID or null if not found.
 */
export function getYouTubeVideoId(url) {
    if (!url) return null;
    // This regex handles:
    // - youtube.com/watch?v=VIDEO_ID
    // - youtu.be/VIDEO_ID
    // - youtube.com/embed/VIDEO_ID
    // - And other variations with parameters.
    const regex = /(?:v=|\/|youtu\.be\/|embed\/)([\w-]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}