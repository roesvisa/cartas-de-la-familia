import { useTheme } from '../theme/ThemeProvider';
import s from './SeasonalDecorations.module.css';
function Snowflake() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true" focusable="false"><path d="M12 2v20M3.34 7l17.32 10M3.34 17L20.66 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M20 14l-4 1 1 4M7 19l1-4-4-1M17 5l-1 4 4 1" /></svg>;
}
export function SeasonalSnowflakes() {
  if (useTheme() !== 'navidad') return null;
  return <div className={s.snow} aria-hidden="true" data-seasonal="snow">{[0,1,2,3,4,5].map(n=><span key={n}><Snowflake /></span>)}</div>;
}
export function SeasonalBadge() {
  if (useTheme() !== 'navidad') return null;
  return <span className={s.badge} data-seasonal="badge"><Snowflake />Navidad</span>;
}
export function SeasonalHolly({ placement = 'summary' }: { placement?: 'summary' | 'crown' }) {
  if (useTheme() !== 'navidad') return null;
  return <svg className={`${s.holly} ${s[placement]}`} data-seasonal="holly" viewBox="0 0 40 24" aria-hidden="true" focusable="false">
    <path fill="var(--seasonal-pine)" d="M19 16C12 17 9 11 2 12L5 8 2 3 9 4 12 1C13 8 21 8 19 16ZM21 16C28 17 31 11 38 12L35 8 38 3 31 4 28 1C27 8 19 8 21 16Z" />
    <path d="M6 6l13 10M34 6L21 16" fill="none" stroke="#749479" strokeWidth=".7" />
    <g fill="var(--seasonal-crimson)"><circle cx="17" cy="17" r="3"/><circle cx="23" cy="17" r="3"/><circle cx="20" cy="21" r="3"/></g>
  </svg>;
}
export function SeasonalRibbon() {
  if (useTheme() !== 'navidad') return null;
  return <div className={s.ribbons} data-seasonal="ribbons" aria-hidden="true">{['left','right'].map(side=><svg key={side} viewBox="0 0 24 30" focusable="false"><path fill="var(--seasonal-crimson)" d="M10 12L4 28l6-3 3 4 2-17M11 11C-3 10 1-2 7 4l5 6C16-3 28 2 20 10l-7 3Z"/><path d="M7 5l5 7 7-6M12 14l-3 10" stroke="var(--seasonal-gold)" strokeWidth="1" fill="none"/><circle cx="12" cy="12" r="2.5" fill="var(--seasonal-gold)"/></svg>)}</div>;
}
