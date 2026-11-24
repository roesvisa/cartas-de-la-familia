import { Crown } from "lucide-react";
import type { User } from "../domain/models";
import s from "./RankingBoard.module.css";

type RankedUser = User & { unique: number };
export function RankingBoard({ rows, currentUserId }: { rows: RankedUser[]; currentUserId: string }) {
  return (
    <div className={s.board}>
      <ol className={s.podium} aria-label="Podio: primeros tres lugares">
        {rows.slice(0, 3).map((user, index) => (
          <li key={user.id} value={index + 1} className={s.winner} data-place={index + 1} data-you={user.id === currentUserId}>
            <div className={s.portrait}>
              {index === 0 && <Crown className={s.crown} aria-hidden="true" />}
              {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <span>{user.initials}</span>}
              <b className={s.medal} aria-label={`Puesto ${index + 1}`}>{index + 1}</b>
            </div>
            <strong className={s.name}>{user.name}</strong>
            <div className={s.identity}>{user.id === currentUserId && <small className={s.you}>Tú</small>}</div>
            <div className={s.step}>
              <strong>{String(user.unique).padStart(2, "0")}</strong>
              <span>cartas</span>
            </div>
          </li>
        ))}
      </ol>
      {rows.length > 3 && (
        <ol className={s.list} start={4} aria-label="Ranking desde el cuarto lugar">
          {rows.slice(3).map((user, index) => (
            <li key={user.id} value={index + 4} data-you={user.id === currentUserId}>
              <span className={s.position} aria-label={`Puesto ${index + 4}`}>{index + 4}</span>
              {user.avatarUrl && <img src={user.avatarUrl} alt="" />}
              <strong>{user.name}{user.id === currentUserId && <small className={s.you}>Tú</small>}</strong>
              <span className={s.count}>{String(user.unique).padStart(2, "0")} cartas</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
