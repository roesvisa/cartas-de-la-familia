import { useEffect, useRef, useState } from "react";
import type { Card } from "../domain/models";
import { tearProgress } from "../application/swipe";
import { RarityEffects } from './RarityEffects';
import s from "./FlipCard.module.css";

export function FlipCard({ card, index, revealed, onReveal }: {
  card: Card; index: number; revealed: boolean; onReveal: () => void;
}) {
  const [angle, setAngle] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{x: number; y: number; width: number; id: number} | null>(null);
  const blocked = useRef(false);
  const moved = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function finish(direction = 1) {
    if (blocked.current) return;
    if (revealed) { onReveal(); return; }
    blocked.current = true;
    gesture.current = null;
    setDragging(false);
    setAngle(direction * 180);
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    timer.current = setTimeout(() => {
      onReveal();
      blocked.current = false;
    }, reduced ? 0 : 220);
  }
  function cancel() {
    gesture.current = null;
    moved.current = true;
    setDragging(false);
    if (!blocked.current) setAngle(0);
  }
  return (
    <button className={s.card} aria-label={revealed ? `Ver ${card.title}` : `Revelar carta ${index + 1}`}
      onPointerDown={(e) => {
        if (blocked.current || !e.isPrimary || e.button !== 0) return;
        moved.current = false;
        if (revealed) return;
        gesture.current = {x: e.clientX, y: e.clientY, width: e.currentTarget.getBoundingClientRect().width, id: e.pointerId};
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
      }}
      onPointerMove={(e) => {
        const g = gesture.current;
        if (!g || g.id !== e.pointerId) return;
        const dx = e.clientX - g.x, dy = e.clientY - g.y;
        if (Math.hypot(dx, dy) > 10) moved.current = true;
        const progress = tearProgress(dx, dy, g.width);
        const direction = dx < 0 ? -1 : 1;
        // At the edge, commit the reveal before the user can inspect the front.
        if (progress > 0.5) finish(direction);
        else setAngle(progress * 180 * direction);
      }}
      onPointerUp={() => {
        if (!gesture.current) return;
        gesture.current = null;
        setDragging(false);
        if (!blocked.current) setAngle(0);
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={() => { if (gesture.current) cancel(); }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (moved.current && e.detail !== 0) { moved.current = false; return; }
        finish();
      }}>
      <span className={s.rotor} data-dragging={dragging} style={{transform: `rotateY(${revealed ? 180 : angle}deg)`}}>
        <span className={s.back} aria-hidden="true"><img src="./cards/optimized/family-card-back.png" alt="" draggable={false} /></span>
        <span className={s.front} aria-hidden="true"><img src={card.imageUrl} alt="" draggable={false} /><RarityEffects category={card.category}/></span>
      </span>
    </button>
  );
}
