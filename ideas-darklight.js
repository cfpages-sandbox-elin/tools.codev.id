/**
 * ideas-darklight.js
 * 
 * Handles the light/dark theme switching for the application.
 */
function initializeTheme() {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-toggle-sun');
    const moonIcon = document.getElementById('theme-toggle-moon');

    // If any element is missing, we can't proceed.
    if (!themeToggleBtn || !sunIcon || !moonIcon) {
        console.error("Theme toggle elements not found. Aborting theme initialization.");
        return;
    }

    const applyTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
    };

    // Check for saved theme in localStorage or user's OS preference
    const isDarkMode = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    applyTheme(isDarkMode);

    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.theme = isDark ? 'dark' : 'light';
        // No need to call applyTheme here, the class toggle already happened.
        // We just need to sync the icon visibility.
        sunIcon.classList.toggle('hidden', isDark);
        moonIcon.classList.toggle('hidden', !isDark);
    });
}

// Ensure the theme initialization runs after the DOM is ready.
document.addEventListener('DOMContentLoaded', initializeTheme);