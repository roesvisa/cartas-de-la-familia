import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react';
import { resolveTheme, type Theme } from './themeConfig';
const ThemeContext = createContext<Theme>('default');
const readTheme = () => resolveTheme(document.documentElement.getAttribute('data-theme'));
function subscribe(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  return () => observer.disconnect();
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'default' as const);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
