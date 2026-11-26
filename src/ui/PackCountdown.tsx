import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { remainingPackMinutes, formatPackCountdown } from '../application/packCountdown';
import s from './App.module.css';

export function PackCountdown({ nextPackAt, serverNow, onReady }: {
  nextPackAt: string;
  serverNow: string;
  onReady: () => Promise<void>;
}) {
  const [minutes, setMinutes] = useState<number | null>(() => remainingPackMinutes(nextPackAt, serverNow, 0));
  useEffect(() => {
    const receivedAt = performance.now();
    let lastAttempt = -Infinity;
    let inFlight = false;
    const tick = () => {
      const elapsed = performance.now() - receivedAt;
      const left = remainingPackMinutes(nextPackAt, serverNow, elapsed);
      setMinutes(left);
      if (left === 0 && !inFlight && elapsed - lastAttempt >= 30_000) {
        lastAttempt = elapsed;
        inFlight = true;
        // Keep the expired counter until the server confirms the refill; retry offline failures.
        void onReady().catch(() => {}).finally(() => { inFlight = false; });
      }
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [nextPackAt, serverNow, onReady]);
  return <p className={s.timer} role="timer" aria-live="off">
    <CalendarDays size={18} aria-hidden="true" />
    {minutes === null ? 'Consultando próximo sobre…' : minutes === 0 ? 'Actualizando sobres…' : formatPackCountdown(minutes)}
  </p>;
}
