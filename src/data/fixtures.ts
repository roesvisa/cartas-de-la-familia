import type { Snapshot } from "../domain/models";
export const COLLECTION_ID = "familia-2026";
export function createFixture(): Snapshot {
  const names = [
    "Mariel",
    "Rodrigo",
    "Mamá",
    "Jesús",
    "Sofía",
    "Nicolás",
    "Valentina",
    "Papá",
    "Camila",
    "Tomás",
  ];
  const avatars = [
    "12a39",
    "00a65",
    "3382d",
    "aa96d",
    "0c8cd",
    "77cf5",
    "3dac3",
    "0cac6",
    "0b5a0",
    "21b5e",
  ];
  const users = names.map((name, i) => ({
    id: i ? "user-" + i : "you",
    name,
    initials: name.slice(0, 2).toUpperCase(),
    avatarUrl: `./figma/${avatars[i]}.png`,
  }));
  const cards = Array.from({ length: 30 }, (_, i) => ({
    id: `moment-${i + 1}`,
    collectionId: COLLECTION_ID,
    number: i + 1,
    title:
      ["Lucía Sandoval", "Rodrigo", "El alfarero"][i] ??
      `Carta por descubrir ${i + 1}`,
    category: i < 18 ? "Común" : i < 26 ? "Rara" : "Especial",
    availableInPacks: i < 3,
    realisticImageUrl:
      i === 0
        ? "./figma/6b38c.png"
        : i === 1
          ? "./cards/optimized/rodrigo.jpg"
          : undefined,
    realisticImagePosition: "left" as const,
    imageUrl:
      i < 3
        ? `./cards/optimized/${["lucia", "rodrigo", "alfarero"][i]}.jpg`
        : "",
  }));
  return {
    user: users[0],
    users,
    collection: {
      id: COLLECTION_ID,
      name: "Cartas de la Familia",
      description: "Tu colección familiar",
      year: "2026",
    },
    cards,
    packs: Array.from({ length: 3 }, (_, i) => ({
      id: `pack-${i + 1}`,
      userId: "you",
      collectionId: COLLECTION_ID,
      status: "available",
    })),
    inventories: users.map((u, i) => ({
      userId: u.id,
      collectionId: COLLECTION_ID,
      quantities: Object.fromEntries(
        cards.slice(0, [0, 6, 4, 3, 3, 3, 3, 3, 2, 1][i]).map((c) => [c.id, 1]),
      ),
    })),
  };
}
