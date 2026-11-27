import { useId } from 'react';
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
  const id = useId().replace(/:/g, '');
  if (useTheme() !== 'navidad') return null;
  return <svg className={`${s.holly} ${s[placement]}`} data-seasonal="holly" viewBox="0 0 72 64" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#a1b84a"/><stop offset=".45" stopColor="#4c7e25"/><stop offset="1" stopColor="#173d19"/></linearGradient>
      <radialGradient id={`${id}-berry`} cx=".3" cy=".25" r=".8"><stop stopColor="#ff8d65"/><stop offset=".25" stopColor="#f44329"/><stop offset=".62" stopColor="#c91f16"/><stop offset="1" stopColor="#710c13"/></radialGradient>
    </defs>
    <g fill={`url(#${id}-leaf)`} stroke="#35581e" strokeWidth=".7">
      <path d="M37 29C24 30 18 23 8 22L10 16 2 9 13 10 16 3 23 9 30 8 29 16 36 19Z"/>
      <path d="M40 32L49 29 52 36 61 34 60 43 69 49 61 51 64 61 54 56 48 61 47 51 39 48 43 42Z"/>
      <path d="M37 31L30 27 30 19 36 20 40 12 43 18 49 17 47 25 50 29 43 32Z"/>
    </g>
    <g fill="none" stroke="#b5cb69" strokeWidth=".8" opacity=".65"><path d="M9 11L36 28M19 14l1 7M27 18l-1 7M43 35l17 21M49 43l8-2M51 47l-1 7M40 29l3-10"/></g>
    <g fill={`url(#${id}-berry)`} stroke="#941a13" strokeWidth=".6"><circle cx="39" cy="26" r="7"/><circle cx="32" cy="36" r="7.5"/><circle cx="46" cy="37" r="7.5"/></g>
    <g fill="#ffccac" opacity=".8"><ellipse cx="37" cy="23" rx="2" ry="1.3"/><ellipse cx="30" cy="33" rx="2" ry="1.3"/><ellipse cx="44" cy="34" rx="2" ry="1.3"/></g>
  </svg>;
}
export function SeasonalRibbon() {
  const id = useId().replace(/:/g, '');
  if (useTheme() !== 'navidad') return null;
  return <div className={s.ribbons} data-seasonal="ribbons" aria-hidden="true">
    <svg className={s.bow} viewBox="0 0 80 94" focusable="false">
      <defs><linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#ff6540"/><stop offset=".3" stopColor="#d32c24"/><stop offset=".62" stopColor="#83101d"/><stop offset="1" stopColor="#eb482b"/></linearGradient></defs>
      <g fill={`url(#${id}-ribbon)`} stroke="#e7ae46" strokeWidth="1.1" strokeLinejoin="round">
        <path d="M8 90L9 70 63 9 78 9Z"/>
        <path d="M30 36L16 72 28 66 36 74 40 39Z"/>
        <path d="M32 34L53 60 52 48 67 49 39 29Z"/>
        <path d="M31 34C14 27 20 2 29 6 40 10 44 25 36 35Z"/>
        <path d="M33 32C42 12 63 9 64 18 63 28 46 39 36 38Z"/>
        <path d="M31 35C13 29 1 35 6 44 11 53 25 50 34 39Z"/>
        <path d="M33 36C44 33 58 36 60 43L45 47 36 40Z"/>
      </g>
      <g fill="none" stroke="#ff9d61" strokeWidth="1" opacity=".8"><path d="M26 10Q24 24 33 31M59 18Q46 20 38 33M9 40Q22 35 29 38M23 61l10-20"/></g>
      <ellipse cx="34" cy="36" rx="6" ry="7" fill={`url(#${id}-ribbon)`} stroke="#e7ae46" strokeWidth="1"/>
    </svg>
    <svg className={s.cornerRibbon} viewBox="0 0 72 62" focusable="false"><path d="M0 0H17L72 47V62Z" fill={`url(#${id}-ribbon)`}/><path d="M2 1L71 60M16 1L71 48" stroke="#f3cb64" strokeWidth="1.5" fill="none"/><path d="M8 1L71 54" stroke="#ff8760" strokeOpacity=".6" fill="none"/></svg>
  </div>;
}
