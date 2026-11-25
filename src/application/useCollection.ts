import { useCallback, useEffect, useRef, useState } from "react";
import type { RevealedCard, Snapshot } from "../domain/models";
import type { CollectionRepository } from "../data/repository";
export function useCollection(
  repository: CollectionRepository,
  collectionId: string,
) {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<RevealedCard[]>([]);
  const busy = useRef(false);
  const version = useRef(0);
  const refresh = useCallback(async () => {
    if (busy.current) return;
    const request = ++version.current;
    try {
      const next = await repository.load(collectionId);
      if (request === version.current && !busy.current) { setSnapshot(next); setError(""); }
    } catch {
      if (request === version.current) setError("No pudimos actualizar la colección. Comprueba tu conexión.");
    }
  }, [repository, collectionId]);
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSnapshot(await repository.load(collectionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
    } finally {
      setLoading(false);
    }
  }, [repository, collectionId]);
  useEffect(() => {
    void reload();
  }, [reload]);
  async function open() {
    if (!snapshot || busy.current) return false;
    const pack = snapshot.packs.find(
      (p) =>
        p.status === "available" &&
        p.userId === snapshot.user.id &&
        p.collectionId === collectionId,
    );
    if (!pack) return false;
    version.current++;
    busy.current = true;
    setOpening(true);
    setError("");
    try {
      const result = await repository.open(collectionId, pack.id);
      setSnapshot(result.snapshot);
      setRevealed(result.revealed);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos abrir tu sobre.");
      return false;
    } finally {
      busy.current = false;
      setOpening(false);
    }
  }
  return {
    snapshot,
    loading,
    opening,
    error,
    revealed,
    reload,
    refresh,
    open,
    closeReveal: () => setRevealed([]),
  };
}
