import { createContext, useCallback, useEffect, useState } from "react";

const THEME_KEY = "flagflow_theme";
const VALID_THEMES = new Set(["dark", "light"]);

function readStoredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_KEY);
    return VALID_THEMES.has(storedTheme) ? storedTheme : "dark";
  } catch {
    return "dark";
  }
}

const initialTheme = readStoredTheme();
if (typeof document !== "undefined") {
  document.documentElement.dataset.theme = initialTheme;
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Theme state remains usable when storage is unavailable.
    }
  }, [theme]);

  const setTheme = useCallback((nextTheme) => {
    if (VALID_THEMES.has(nextTheme)) setThemeState(nextTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((currentTheme) => currentTheme === "dark" ? "light" : "dark");
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export default ThemeContext;
