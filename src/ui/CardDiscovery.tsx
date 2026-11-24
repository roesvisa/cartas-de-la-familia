import { useEffect, useId, useMemo, useState } from "react";
import type { Card } from "../domain/models";
import { createHoldToReveal } from "../application/holdToReveal";
import s from "./App.module.css";
export function CardDiscovery({ card }: { card: Card }) {
  const [revealed, setRevealed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const hint = useId();
  const hold = useMemo(() => createHoldToReveal(setRevealed), []);
  useEffect(() => {
    const stop = () => hold.stop();
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", stop);
    return () => {
      hold.stop();
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", stop);
    };
  }, [hold]);
  const available = Boolean(card.realisticImageUrl) && !failed;
  const showing = available && ready && revealed;
  return (
    <div className={s.discovery}>
      <button
        type="button"
        className={s.discoveryCard}
        aria-label={`Descubrir la versión realista de ${card.title}`}
        aria-describedby={hint}
        aria-pressed={showing}
        onPointerDown={(e) => {
          if (
            !available ||
            !e.isPrimary ||
            (e.pointerType === "mouse" && e.button !== 0)
          )
            return;
          e.preventDefault();
          e.currentTarget.focus({ preventScroll: true });
          e.currentTarget.setPointerCapture(e.pointerId);
          hold.start();
        }}
        onPointerUp={() => hold.stop()}
        onPointerCancel={() => hold.stop()}
        onLostPointerCapture={() => hold.stop()}
        onBlur={() => hold.stop()}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            if (available && !e.repeat) hold.start();
          }
          if (e.key === "Escape") hold.stop();
        }}
        onKeyUp={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            hold.stop();
          }
        }}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <img
          className={s.discoveryDrawing}
          src={card.imageUrl}
          alt={`${card.title}, dibujo`}
          draggable={false}
          aria-hidden={showing}
        />
        {card.realisticImageUrl && (
          <img
            className={s.discoveryRealistic}
            src={card.realisticImageUrl}
            alt={`${card.title}, versión realista`}
            draggable={false}
            aria-hidden={!showing}
            style={{
              opacity: showing ? 1 : 0,
              objectPosition: card.realisticImagePosition ?? "center",
            }}
            ref={(image) => {
              if (image?.complete && image.naturalWidth > 0) setReady(true);
            }}
            onLoad={() => setReady(true)}
            onError={() => {
              setFailed(true);
              hold.stop();
            }}
          />
        )}
      </button>
      <p id={hint} className={s.discoveryHint}>
        {!card.realisticImageUrl
          ? "Versión realista pendiente de incorporar."
          : failed
            ? "No se pudo cargar la versión realista."
            : !ready
              ? "Preparando el descubrimiento…"
              : "Mantén presionada la carta para descubrir su versión realista."}
      </p>
    </div>
  );
}
