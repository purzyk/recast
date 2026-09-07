import { darkTheme, lightTheme } from '@/app/theme.css'

export type Theme = 'dark' | 'light'

export const THEME_STORAGE_KEY = 'recast-theme'

export const themeClass: Record<Theme, string> = {
  dark: darkTheme,
  light: lightTheme,
}

/**
 * Runs in <head>, before React paints anything.
 *
 * The theme is a class name, so applying it from React means the first paint
 * uses the wrong palette and then corrects — a visible flash on every load.
 * This resolves the choice first.
 *
 * The class names are generated at build time, so they have to be
 * interpolated rather than written literally; that is the whole reason this
 * lives next to the imports rather than in a static file.
 *
 * Dark is the fallback in the catch, because dark is primary — and because a
 * browser with localStorage disabled should still get the intended default
 * rather than whatever the OS happens to prefer.
 */
export const themeScript = `(function(){try{
var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
var d=s?s==='dark':!window.matchMedia('(prefers-color-scheme: light)').matches;
document.documentElement.classList.add(d?${JSON.stringify(darkTheme)}:${JSON.stringify(lightTheme)});
}catch(e){document.documentElement.classList.add(${JSON.stringify(darkTheme)});}})();`
