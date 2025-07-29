/**
 * ideas-darklight.js (v2 - More Robust)
 *
 * Handles the light/dark theme switching for the application.
 */
function initializeTheme() {
    console.log("Theme Manager: Initializing...");

    // 1. Get references to all necessary elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const sunIcon = document.getElementById('theme-toggle-sun');
    const moonIcon = document.getElementById('theme-toggle-moon');
    const htmlElement = document.documentElement;

    // 2. Safety Check: If any element is missing, we can't proceed.
    if (!themeToggleBtn || !sunIcon || !moonIcon) {
        console.error("Theme Manager: Critical theme toggle elements not found in the DOM. Aborting.");
        return;
    }
    console.log("Theme Manager: All elements found successfully.");

    // 3. Central function to apply the theme state to the UI
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            htmlElement.classList.add('dark');
            sunIcon.classList.add('hidden');
            moonIcon.classList.remove('hidden');
        } else {
            htmlElement.classList.remove('dark');
            sunIcon.classList.remove('hidden');
            moonIcon.classList.add('hidden');
        }
        console.log(`Theme Manager: Theme applied -> ${theme}`);
    };

    // 4. Determine the initial theme
    // Check localStorage first, then the OS preference. Default to 'light'.
    let currentTheme = localStorage.getItem('theme');
    if (!currentTheme) {
        currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    // 5. Apply the initial theme on load
    applyTheme(currentTheme);

    // 6. Set up the event listener for the button
    themeToggleBtn.addEventListener('click', () => {
        // Determine the new theme by checking the current state
        const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
        
        // Save the new theme preference
        localStorage.setItem('theme', newTheme);
        
        // Apply the new theme to the UI
        applyTheme(newTheme);
    });
    
    console.log("Theme Manager: Initialization complete and event listener attached.");
}

// Ensure the theme initialization runs only after the DOM is fully loaded.
if (document.readyState === 'loading') {
    // Still loading, so wait for the event
    document.addEventListener('DOMContentLoaded', initializeTheme);
} else {
    // The DOM is already loaded, run the function immediately
    initializeTheme();
}