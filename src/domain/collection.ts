import type { Card, Inventory, OpenPackResult, Snapshot } from "./models";
export function progress(cards: Card[], inventory?: Inventory) {
  const owned = cards.filter(
    (card) => (inventory?.quantities[card.id] ?? 0) > 0,
  );
  const duplicates = owned.reduce(
    (sum, card) => sum + Math.max(0, (inventory?.quantities[card.id] ?? 0) - 1),
    0,
  );
  return {
    unique: owned.length,
    total: cards.length,
    duplicates,
    ownedTotal: owned.length + duplicates,
    percent: cards.length ? Math.round((owned.length / cards.length) * 100) : 0,
  };
}
export function ranking(snapshot: Snapshot) {
  if (snapshot.leaderboard) return [...snapshot.leaderboard].sort((a, b) => b.unique - a.unique || (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
  return snapshot.users
    .map((user) => ({
      ...user,
      ...progress(
        snapshot.cards,
        snapshot.inventories.find(
          (i) =>
            i.userId === user.id && i.collectionId === snapshot.collection.id,
        ),
      ),
    }))
    .sort((a, b) => b.unique - a.unique || a.name.localeCompare(b.name, "es"));
}
export function openPack(
  snapshot: Snapshot,
  packId: string,
  random = Math.random,
): OpenPackResult {
  const pack = snapshot.packs.find(
    (p) =>
      p.id === packId &&
      p.userId === snapshot.user.id &&
      p.collectionId === snapshot.collection.id,
  );
  if (!pack || pack.status !== "available")
    throw new Error("Este sobre ya no está disponible.");
  const cards = snapshot.cards.filter(
    (c) => c.collectionId === pack.collectionId && c.availableInPacks !== false,
  );
  if (!cards.length) throw new Error("Esta colección todavía no tiene cartas.");
  const next = structuredClone(snapshot);
  let inventory = next.inventories.find(
    (i) => i.userId === pack.userId && i.collectionId === pack.collectionId,
  );
  if (!inventory) {
    inventory = {
      userId: pack.userId,
      collectionId: pack.collectionId,
      quantities: {},
    };
    next.inventories.push(inventory);
  }
  const revealed = Array.from({ length: 3 }, () => {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw new Error("No se pudo sortear el sobre.");
    const card = cards[Math.floor(value * cards.length)];
    const quantity = inventory.quantities[card.id] ?? 0;
    inventory.quantities[card.id] = quantity + 1;
    return { card, duplicate: quantity > 0 };
  });
  next.packs.find((p) => p.id === pack.id)!.status = "opened";
  return { snapshot: next, revealed };
}
