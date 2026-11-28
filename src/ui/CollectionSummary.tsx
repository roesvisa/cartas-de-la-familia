import { Trophy } from "lucide-react";
import { SeasonalHolly } from "./SeasonalDecorations";
import s from "./CollectionSummary.module.css";

type Props = {
  unique: number;
  capacity: number;
  ownedTotal: number;
  rank?: number;
  onRanking?: () => void;
  onCollection?: () => void;
};
const count = (value: number) => String(value).padStart(2, "0");

export function CollectionSummary({ unique, capacity, ownedTotal, rank, onRanking, onCollection }: Props) {
  const home = rank !== undefined;
  const Metric = home ? "button" : "div";
  return (
    <div className={`${s.panel} ${home ? s.home : s.collection}`}>
      <SeasonalHolly />
      <Metric className={`${s.metric} ${home ? s.collectionLink : ""}`} onClick={home ? onCollection : undefined}>
        {home && <img src="./figma/decb2.svg" alt="" />}
        <div>
          <span>{home ? "Mi colección" : "Cartas distintas"}</span>
          <p><strong>{count(unique)}</strong> / {capacity}</p>
        </div>
      </Metric>
      {home ? (
        <button className={s.ranking} onClick={onRanking}>
          <Trophy aria-hidden="true" />
          <div><span>Mi ranking</span><p><strong># {rank}</strong></p></div>
        </button>
      ) : (
        <>
          <img className={s.centerIcon} src="./figma/decb2.svg" alt="" />
          <div className={s.metric}>
            <div><span>Cartas totales</span><p><strong>{count(ownedTotal)}</strong></p></div>
          </div>
        </>
      )}
    </div>
  );
}
