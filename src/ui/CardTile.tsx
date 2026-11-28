import { resolveImageUrl } from '../data/imageUrls';
import { useId, useState } from "react";
import { PhysicalCard } from './PhysicalCard';
import locked from "./LockedCard.module.css";
import type { Card } from "../domain/models";
import s from "./App.module.css";
export function CardTile({
  card,
  quantity,
  onClick,
}: {
  card: Card;
  quantity: number;
  onClick?: () => void;
}) {
  if (quantity) return <PhysicalCard key={card.id} card={card} quantity={quantity} compact onOpen={onClick}/>;
  return (
    <button
      className={quantity ? s.card : `${s.card} ${locked.slot}`}
      onClick={onClick}
      disabled={!quantity}
      aria-label={`${card.title}, ${quantity ? `${quantity} copias` : "por descubrir"}`}
    >
      {quantity ? (
        <img src={resolveImageUrl(card.imageUrl)} alt={card.title} />
      ) : (
        <LockedArtwork key={`${card.id}:${card.imageUrl}`} card={card} />
      )}
      {quantity > 1 && (
        <small aria-label={`${quantity} copias`}>x{quantity}</small>
      )}
    </button>
  );
}

/** Uses only the assigned illustration; no separate silhouette asset is needed. */
function LockedArtwork({ card }: { card: Card }) {
  const filterId = `shadow-${useId().replace(/:/g, "")}`;
  const [failed, setFailed] = useState(false);
  return <>
    {card.imageUrl && !failed ? <>
      <svg className={locked.filter} aria-hidden="true" focusable="false">
        <defs><filter id={filterId} colorInterpolationFilters="sRGB">
          {/* Convert dark image regions to a flat shadow, including opaque JPGs.
              brightness(0) alone would turn an opaque image into a rectangle. */}
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -.2126 -.7152 -.0722 0 1" />
          <feComponentTransfer><feFuncA type="discrete" tableValues="0 0 1 1" /></feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" />
        </filter></defs>
      </svg>
      <img className={locked.shadow} src={resolveImageUrl(card.imageUrl)} alt="" aria-hidden="true"
        loading="lazy" decoding="async" draggable={false}
        style={{ filter: `url(#${filterId})` }} onError={() => setFailed(true)} />
    </> : <svg className={locked.fallback} viewBox="0 0 100 140" aria-hidden="true" focusable="false">
      <circle cx="50" cy="43" r="23" />
      <path d="M12 140v-28c0-28 16-44 38-44s38 16 38 44v28Z" />
    </svg>}
    <span className={locked.number}>{String(card.number).padStart(2, "0")}</span>
  </>;
}
