import { describe, it, expect } from "vitest";
import { createFixture, COLLECTION_ID } from "../data/fixtures";
import { progress, openPack, ranking } from "./collection";
import { MockCollectionRepository } from "../data/mockRepository";
import { login, DEMO_EMAIL, DEMO_PASSWORD } from "../data/mockSession";
describe("colección familiar", () => {
  it("comienza vacía con 30 cartas y tres sobres", () => {
    const d = createFixture();
    expect(d.cards).toHaveLength(30);
    expect(d.packs).toHaveLength(3);
    expect(progress(d.cards, d.inventories[0])).toEqual({
      unique: 0,
      total: 30,
      duplicates: 0,
      ownedTotal: 0,
      percent: 0,
    });
  });
  it("revela tres cartas y cuenta repetidas dentro del sobre", () => {
    const d = createFixture(),
      original = structuredClone(d);
    const r = openPack(d, "pack-1", () => 0);
    expect(r.revealed.map((c) => c.duplicate)).toEqual([false, true, true]);
    expect(progress(r.snapshot.cards, r.snapshot.inventories[0])).toMatchObject(
      { unique: 1, duplicates: 2, ownedTotal: 3 },
    );
    expect(
      r.snapshot.packs.filter((p) => p.status === "available"),
    ).toHaveLength(2);
    expect(d).toEqual(original);
  });
  it("acumula duplicados sin incrementar únicas", () => {
    let d = openPack(createFixture(), "pack-1", () => 0).snapshot;
    d = openPack(d, "pack-2", () => 0).snapshot;
    expect(progress(d.cards, d.inventories[0])).toMatchObject({
      unique: 1,
      duplicates: 5,
      ownedTotal: 6,
    });
  });
  it("rechaza sobres gastados o ajenos", () => {
    const d = createFixture();
    expect(() => openPack(openPack(d, "pack-1").snapshot, "pack-1")).toThrow();
    d.packs[0].userId = "other";
    expect(() => openPack(d, "pack-1")).toThrow();
    d.packs[1].collectionId = "other";
    expect(() => openPack(d, "pack-2")).toThrow();
  });
  it("no consume un sobre si el catálogo está vacío", () => {
    const d = createFixture();
    d.cards = [];
    expect(() => openPack(d, "pack-1")).toThrow();
    expect(d.packs[0].status).toBe("available");
  });
  it("ordena el ranking por únicas", () => {
    const d = createFixture();
    d.inventories[0].quantities["moment-1"] = 100;
    expect(ranking(d)[0].unique).toBe(6);
    expect(ranking(d).find((u) => u.id === "you")?.unique).toBe(1);
  });
  it("evita el doble consumo concurrente", async () => {
    const repo = new MockCollectionRepository(0);
    const results = await Promise.allSettled([
      repo.open(COLLECTION_ID, "pack-1"),
      repo.open(COLLECTION_ID, "pack-1"),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  });
  it("agota 3, 2, 1 y 0 sobres", async () => {
    const repo = new MockCollectionRepository(0);
    for (let i = 1; i <= 3; i++) {
      await repo.open(COLLECTION_ID, `pack-${i}`);
      expect(
        (await repo.load(COLLECTION_ID)).packs.filter(
          (p) => p.status === "available",
        ),
      ).toHaveLength(3 - i);
    }
    await expect(repo.open(COLLECTION_ID, "pack-3")).rejects.toThrow();
  });
  it("simula ranking vacío con sobres disponibles", async () => {
    const d = await new MockCollectionRepository(0, "empty").load(
      COLLECTION_ID,
    );
    expect(ranking(d).filter((u) => u.unique)).toHaveLength(0);
    expect(d.packs).toHaveLength(3);
  });
  it("permite probar cantidad de sobres y errores", async () => {
    expect(
      (await new MockCollectionRepository(0, "normal", 0).load(COLLECTION_ID))
        .packs,
    ).toHaveLength(0);
    await expect(
      new MockCollectionRepository(0, "error").load(COLLECTION_ID),
    ).rejects.toThrow();
  });
  it("valida acceso simulado sin registro", async () => {
    await expect(login(DEMO_EMAIL, DEMO_PASSWORD)).resolves.toBeUndefined();
    await expect(login(DEMO_EMAIL, "incorrecta")).rejects.toThrow();
  });
});

describe("identidad de las cartas disponibles", () => {
  it("no asigna una misma ilustración a varias cartas obtenibles", () => {
    const cards = createFixture().cards.filter((c) => c.availableInPacks);
    expect(new Set(cards.map((c) => c.imageUrl)).size).toBe(cards.length);
  });
  it("tres copias ocupan un solo espacio y suman una única al ranking", () => {
    const r = openPack(createFixture(), "pack-1", () => 0).snapshot;
    expect(r.inventories[0].quantities["moment-1"]).toBe(3);
    expect(
      r.cards.filter((c) => r.inventories[0].quantities[c.id] > 0),
    ).toHaveLength(1);
    expect(progress(r.cards, r.inventories[0]).unique).toBe(1);
    expect(ranking(r).find((u) => u.id === "you")?.unique).toBe(1);
  });
  it("no sortea espacios reservados aunque el aleatorio sea cercano a uno", () => {
    expect(
      openPack(createFixture(), "pack-1", () => 0.999).revealed.every(
        (r) => r.card.availableInPacks,
      ),
    ).toBe(true);
  });
});

it('uses aggregate server ranking without exposing other inventories', () => {
 const snapshot = createFixture();
 snapshot.leaderboard = [
  {id:'a',name:'Ana',initials:'A',unique:2},
  {id:'b',name:'Beto',initials:'B',unique:3},
 ];
 expect(ranking(snapshot).map(row => [row.id,row.unique])).toEqual([['b',3],['a',2]]);
});


it('respects the server chronological position for equal unique counts, not names', () => {
 const snapshot = createFixture();
 snapshot.leaderboard = [
  {id:'later',name:'Ana',initials:'A',unique:3,position:2},
  {id:'first',name:'Zoe',initials:'Z',unique:3,position:1},
  {id:'third',name:'Beto',initials:'B',unique:3,position:3},
 ];
 expect(ranking(snapshot).map(row => row.id)).toEqual(['first','later','third']);
});
