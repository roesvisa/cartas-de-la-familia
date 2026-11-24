import { useEffect, useRef, useState } from "react";
import type { RevealedCard } from "../domain/models";
import { Button, Title } from "./Components";
import { FlipCard } from "./FlipCard";
import s from "./App.module.css";
export function PackReveal({
  cards,
  onAlbum,
  onHome,
  onNext,
  available,
}: {
  cards: RevealedCard[];
  onAlbum: () => void;
  onHome: () => void;
  onNext: () => void;
  available: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [shown, setShown] = useState<number[]>([]),
    [large, setLarge] = useState<number | null>(null);
  useEffect(() => {
    if (large !== null) dialog.current?.showModal();
    else dialog.current?.close();
  }, [large]);
  return (
    <section className={s.reveal}>
      <Title>Tus nuevas cartas</Title>
      <p className={s.pill} aria-live="polite">
        <b>{shown.length}</b> de 3 descubiertas
      </p>
      <div className={s.revealCards}>
        {cards.map(({ card }, i) => (
          <FlipCard key={i} card={card} index={i} revealed={shown.includes(i)} onReveal={() => {
            setShown((a) => a.includes(i) ? a : [...a, i]);
            setLarge(i);
          }} />
        ))}
      </div>
      {shown.length === 3 && (
        <div className={s.revealActions}>
          {available && <Button onClick={onNext}>Abrir siguiente sobre</Button>}
          {available ? (
            <button className={s.textButton} onClick={onAlbum}>Ver mi colección</button>
          ) : (
            <>
              <Button onClick={onAlbum}>Ver mi colección</Button>
              <button className={s.textButton} onClick={onHome}>Ir al Home</button>
            </>
          )}
        </div>
      )}
      <dialog
        ref={dialog}
        className={s.largeOverlay}
        aria-label="Carta descubierta"
        onCancel={() => setLarge(null)}
      >
        {large !== null && (
          <button
            autoFocus
            className={s.largeCard}
            onClick={() => setLarge(null)}
            aria-label="Cerrar carta y continuar"
          >
            <img
              src={cards[large].card.imageUrl}
              alt={cards[large].card.title}
            />
            <span>
              {cards[large].duplicate ? "Repetida" : "¡Nueva!"} · Toca para
              continuar
            </span>
          </button>
        )}
      </dialog>
    </section>
  );
}
