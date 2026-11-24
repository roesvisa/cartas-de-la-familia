import { useRef, useState, type CSSProperties } from "react";
import { tearProgress } from "../application/swipe";
import s from "./App.module.css";
export function SwipeToOpen({
  disabled,
  onOpen,
}: {
  disabled: boolean;
  onOpen: () => Promise<boolean>;
}) {
  const packet = useRef<HTMLButtonElement>(null);
  const start = useRef<{
    x: number;
    y: number;
    id: number;
    width: number;
  } | null>(null);
  const locked = useRef(false),
    suppressClick = useRef(false);
  const [progress, setProgress] = useState(0),
    [direction, setDirection] = useState(1),
    [completed, setCompleted] = useState(false),
    [dragging, setDragging] = useState(false);
  async function complete() {
    if (locked.current || disabled) return;
    locked.current = true;
    setCompleted(true);
    setDragging(false);
    setProgress(1);
    start.current = null;
    try {
      if (await onOpen()) return;
    } catch {
      /* Parent reports repository errors. */
    }
    locked.current = false;
    setCompleted(false);
    setProgress(0);
  }
  function cancel() {
    start.current = null;
    setDragging(false);
    if (!locked.current) setProgress(0);
    suppressClick.current = true;
  }
  const style = {
    "--tear-progress": progress,
    "--tear-percent": `${progress * 100}%`,
    "--tear-direction": direction,
  } as CSSProperties;
  return (
    <div
      className={s.swipeZone}
      style={style}
      data-tearing={dragging}
      data-complete={completed}
      data-direction={direction === 1 ? "right" : "left"}
      onPointerDown={(e) => {
        if (disabled || locked.current || !e.isPrimary || e.button !== 0)
          return;
        const width = packet.current?.getBoundingClientRect().width ?? 180;
        start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, width };
        suppressClick.current = false;
        setDragging(true);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const p = start.current;
        if (!p || p.id !== e.pointerId || locked.current) return;
        const dx = e.clientX - p.x,
          dy = e.clientY - p.y;
        const value = tearProgress(dx, dy, p.width);
        setDirection(dx < 0 ? -1 : 1);
        setProgress(value);
        if (Math.hypot(dx, dy) > 12) suppressClick.current = true;
        if (value >= 1) void complete();
      }}
      onPointerUp={(e) => {
        const p = start.current;
        if (!p || p.id !== e.pointerId) return;
        const value = tearProgress(e.clientX - p.x, e.clientY - p.y, p.width);
        if (value >= 1) {
          suppressClick.current = true;
          void complete();
        } else {
          start.current = null;
          setDragging(false);
          setProgress(0);
          if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > 12)
            suppressClick.current = true;
        }
      }}
      onPointerCancel={cancel}
      onLostPointerCapture={() => {
        if (start.current) cancel();
      }}
      onClickCapture={(e) => {
        if (suppressClick.current && e.detail !== 0) {
          e.preventDefault();
          e.stopPropagation();
          suppressClick.current = false;
        }
      }}
    >
      <div className={s.packetHalo} aria-hidden="true" />
      <button
        ref={packet}
        className={s.tearPacket}
        disabled={disabled || completed}
        onClick={() => void complete()}
        aria-label="Abrir sobre de tres cartas"
      >
        <img
          className={s.packetBody}
          src="./figma/1bbb6.png"
          alt="Sobre de prueba"
          draggable={false}
        />
        <span className={s.packetInterior} aria-hidden="true" />
        <img
          className={s.packetSeal}
          src="./figma/1bbb6.png"
          alt=""
          draggable={false}
        />
        <span className={s.tearTrack} aria-hidden="true" />
        <span className={s.tearSpark} aria-hidden="true" />
      </button>
    </div>
  );
}
