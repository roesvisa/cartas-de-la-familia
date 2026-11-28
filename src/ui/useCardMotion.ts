import { useEffect, useRef, useState, type PointerEvent, type KeyboardEvent } from 'react';
import { cardMotion, cardFinish, gestureAngles } from './cardVisualConfig';
// Only the active card schedules frames. React updates only when its face changes.
export function useCardMotion({ allowScroll = true } = {}) {
  const ref = useRef<HTMLButtonElement>(null);
  const base = useRef(0), busy = useRef(false), moved = useRef(false);
  const gesture = useRef<{id:number;x:number;y:number;width:number} | null>(null);
  const raf = useRef(0), timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [rear, setRear] = useState(false);
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function paint(y: number, x = 0, active = false) {
    const el = ref.current; if (!el) return;
    el.style.setProperty('--turn', `${reduced() ? base.current : y}deg`);
    el.style.setProperty('--tilt', `${reduced() ? 0 : x}deg`);
    const offset = y - base.current;
    el.style.setProperty('--light-x', `${50 + Math.sin(offset * Math.PI / 180) * cardFinish.reflectionTravel}%`);
    el.style.setProperty('--light-y', `${50 + x * 4}%`);
    el.style.setProperty('--rim-angle', `${offset * 4 + x * 12}deg`);
    el.style.setProperty('--foil-strength', `${active ? cardFinish.foilActive : cardFinish.foilRest}`);
  }
  function settle() {
    cancelAnimationFrame(raf.current); gesture.current = null;
    if (!busy.current) { ref.current?.setAttribute('data-motion','return'); paint(base.current); }
  }
  function flip(direction: number) {
    if (busy.current) return;
    cancelAnimationFrame(raf.current); gesture.current = null; busy.current = true; moved.current = true;
    base.current += direction * 180;
    setRear(Math.abs(base.current / 180) % 2 === 1);
    ref.current?.setAttribute('data-motion','flip'); paint(base.current);
    timer.current = setTimeout(() => { busy.current = false; ref.current?.setAttribute('data-motion','idle'); }, reduced() ? 0 : cardMotion.flipMs);
  }
  useEffect(() => {
    const reset = () => settle();
    window.addEventListener('blur', reset); document.addEventListener('visibilitychange', reset);
    return () => { cancelAnimationFrame(raf.current); clearTimeout(timer.current); window.removeEventListener('blur',reset); document.removeEventListener('visibilitychange',reset); };
  }, []);
  return { ref, rear, moved, handlers: {
    onPointerDown(e: PointerEvent<HTMLButtonElement>) {
      if (busy.current || gesture.current || !e.isPrimary || e.button !== 0) return;
      moved.current = false;
      gesture.current = {id:e.pointerId,x:e.clientX,y:e.clientY,width:e.currentTarget.getBoundingClientRect().width};
      if (!allowScroll) e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove(e: PointerEvent<HTMLButtonElement>) {
      const g = gesture.current; if (!g || g.id !== e.pointerId || busy.current) return;
      const dx=e.clientX-g.x, dy=e.clientY-g.y;
      if (Math.hypot(dx,dy)<3) return;
      moved.current=true;
      // Leave vertical scrolling to the browser; capture only a horizontal gesture.
      if (allowScroll && Math.abs(dy)>Math.abs(dx) && e.currentTarget.dataset.motion !== 'drag') { settle(); return; }
      if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.setPointerCapture(e.pointerId);
      const angles=gestureAngles(dx,dy,g.width);
      if (Math.abs(angles.y)>=cardMotion.threshold) { flip(Math.sign(angles.y)); return; }
      e.currentTarget.dataset.motion='drag'; cancelAnimationFrame(raf.current);
      raf.current=requestAnimationFrame(()=>paint(base.current+angles.y,angles.x,true));
    },
    onPointerUp(e: PointerEvent<HTMLButtonElement>) {
      if (gesture.current?.id === e.pointerId) settle();
    },
    onPointerCancel(e: PointerEvent<HTMLButtonElement>) {
      if (gesture.current?.id === e.pointerId) settle();
    },
    onLostPointerCapture(e: PointerEvent<HTMLButtonElement>) {
      // Touch implicitly captures descendants. Transferring that capture bubbles
      // a lost event from the old target; it is not the end of our gesture.
      if (e.target !== e.currentTarget || gesture.current?.id !== e.pointerId) return;
      if (!e.currentTarget.hasPointerCapture?.(e.pointerId)) settle();
    },
    onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
      if (['ArrowLeft','ArrowRight',' '].includes(e.key)) { e.preventDefault(); if (!e.repeat) flip(e.key==='ArrowLeft'?-1:1); }
      if (e.key==='Escape') settle();
    },
    onBlur: settle,
  }};
}
