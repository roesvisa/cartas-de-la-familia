export interface User {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string;
}
export interface Collection {
  id: string;
  name: string;
  description: string;
  year: string;
}
export interface Card {
  id: string;
  collectionId: string;
  number: number;
  title: string;
  category: string;
  /** Illustrated version: always used by packs and album. */
  imageUrl: string;
  /** Optional only while completing the demo assets. Required for final cards. */
  realisticImageUrl?: string;
  realisticImagePosition?: "left" | "center" | "right";
  availableInPacks?: boolean;
}
export interface Pack {
  id: string;
  userId: string;
  collectionId: string;
  status: "available" | "opened";
}
export interface Inventory {
  userId: string;
  collectionId: string;
  quantities: Record<string, number>;
}
export interface RankingEntry extends User { unique: number; position?: number; }
export interface Snapshot {
  leaderboard?: RankingEntry[];
  user: User;
  collection: Collection;
  cards: Card[];
  packs: Pack[];
  inventories: Inventory[];
  users: User[];
}
export interface RevealedCard {
  card: Card;
  duplicate: boolean;
}
export interface OpenPackResult {
  snapshot: Snapshot;
  revealed: RevealedCard[];
}
