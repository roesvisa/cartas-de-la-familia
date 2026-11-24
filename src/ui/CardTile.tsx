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
  return (
    <button
      className={s.card}
      onClick={onClick}
      disabled={!quantity}
      aria-label={`${card.title}, ${quantity ? `${quantity} copias` : "por descubrir"}`}
    >
      {quantity ? (
        <img src={card.imageUrl} alt={card.title} />
      ) : (
        <span>{String(card.number).padStart(2, "0")}</span>
      )}
      {quantity > 1 && (
        <small aria-label={`${quantity} copias`}>x{quantity}</small>
      )}
    </button>
  );
}
