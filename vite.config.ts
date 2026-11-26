import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { ACTIVE_THEME, resolveTheme } from './src/theme/themeConfig';
export default defineConfig({ base: "./", plugins: [react(), {
  name: 'initial-seasonal-theme',
  transformIndexHtml(html) {
    return html.replace('<html lang="es">', `<html lang="es" data-theme="${resolveTheme(ACTIVE_THEME)}">`);
  },
}] });
