export const THEMES = ['default', 'navidad'] as const;
export type Theme = typeof THEMES[number];

// Change only this value to restore the original Obsidian appearance.
export const ACTIVE_THEME: Theme = 'navidad';

// Future remote configuration must pass through this boundary.
export function resolveTheme(value: unknown): Theme {
  return value === 'navidad' || value === 'default' ? value : 'default';
}
export function applyTheme(value: unknown): Theme {
  const theme = resolveTheme(value);
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}
