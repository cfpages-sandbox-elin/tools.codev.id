const appState = {
    supadataApiKey: null,
    allAiProviders: null,
    currentTranscript: null,
    currentVideoId: null,
    isLoading: false,
    activeTab: 'brainstorm', // Add this line
};

/**
 * Updates the global application state.
 * @param {object} newState - An object with keys to update in the state.
 */
export function updateState(newState) {
    Object.assign(appState, newState);
}

/**
 * Returns the current state.
 * @returns {object} The global application state.
 */
export function getState() {
    return appState;
}