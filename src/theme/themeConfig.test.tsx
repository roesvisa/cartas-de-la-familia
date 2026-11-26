// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { applyTheme, resolveTheme } from './themeConfig';
import { ThemeProvider } from './ThemeProvider';
import { SeasonalBadge, SeasonalHolly, SeasonalRibbon, SeasonalSnowflakes } from '../ui/SeasonalDecorations';
it('validates configuration and falls back to Obsidian',()=>{
 for(const value of [null,undefined,'other',{},'NAVIDAD',1]) expect(resolveTheme(value)).toBe('default');
 expect(resolveTheme('navidad')).toBe('navidad');expect(resolveTheme('default')).toBe('default');
});
it('reacts to the root theme and removes all seasonal markup on default',async()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 const host=document.createElement('div');document.body.append(host);const root=createRoot(host);
 try {
 applyTheme('default');
 await act(async()=>root.render(<ThemeProvider><SeasonalSnowflakes/><SeasonalBadge/><SeasonalHolly/><SeasonalRibbon/></ThemeProvider>));
 expect(host.innerHTML).toBe('');
 await act(async()=>{applyTheme('navidad');});
 expect(host.querySelectorAll('[data-seasonal]')).toHaveLength(4);
 expect(host.querySelectorAll('[data-seasonal="snow"] svg')).toHaveLength(6);
 expect(host.textContent).toBe('Navidad');
 await act(async()=>{document.documentElement.setAttribute('data-theme','default');});
 expect(host.innerHTML).toBe('');
 } finally {act(()=>root.unmount());host.remove();applyTheme('default');}
});
