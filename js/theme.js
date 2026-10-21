

(function () {
    const THEME_STORAGE_KEY = 'project_node_theme_preference';

    
    try {
        localStorage.removeItem(THEME_STORAGE_KEY);
    } catch (e) {}

    function applyLightTheme() {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.setAttribute('data-theme-mode', 'light');
    }

    applyLightTheme();

    window.NodeTheme = {
        getPreference: () => 'light',
        setPreference: () => applyLightTheme(),
        applyTheme: () => applyLightTheme(),
        isDark: () => false
    };

    document.addEventListener('DOMContentLoaded', applyLightTheme);
})();
