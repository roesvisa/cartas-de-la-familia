import { expect, it } from 'vitest';
import { remainingPackMinutes, formatPackCountdown } from './packCountdown';
const start='2026-11-25T12:00:00Z', next='2026-11-26T12:00:00Z';
it('counts a full 24 hours from server time, preserving the next deadline',()=>{
 expect(remainingPackMinutes(next,start,0)).toBe(1440);
 expect(remainingPackMinutes(next,start,3600_000)).toBe(1380);
 expect(formatPackCountdown(1437)).toBe('Próximo sobre en 23 h 57 min');
});
it('rounds up before expiry and never shows negative time',()=>{
 expect(remainingPackMinutes(next,start,86400_000-1)).toBe(1);
 expect(remainingPackMinutes(next,start,86400_000)).toBe(0);
 expect(remainingPackMinutes(next,start,86400_000*7)).toBe(0);
 expect(remainingPackMinutes('invalid',start,0)).toBeNull();
});
