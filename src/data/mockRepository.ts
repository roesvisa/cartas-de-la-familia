import { openPack } from "../domain/collection";
import { createFixture } from "./fixtures";
import type { CollectionRepository } from "./repository";
export class MockCollectionRepository implements CollectionRepository {
  private state = createFixture();
  constructor(
    private delay = 450,
    private scenario: "normal" | "empty" | "error" = "normal",
    packCount = 3,
  ) {
    this.state.packs = this.state.packs.slice(
      0,
      Math.max(0, Math.min(3, packCount)),
    );
    if (scenario === "empty") {
      this.state.users = [this.state.user];
      this.state.inventories = [];
    }
  }
  private async wait(collectionId: string) {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    if (this.scenario === "error")
      throw new Error("No pudimos cargar tu colección. Inténtalo de nuevo.");
    if (collectionId !== this.state.collection.id)
      throw new Error("No encontramos esta colección.");
  }
  async load(collectionId: string) {
    await this.wait(collectionId);
    return structuredClone(this.state);
  }
  async open(collectionId: string, packId: string) {
    await this.wait(collectionId);
    // No await between checking availability and committing: duplicate requests cannot spend twice.
    const result = openPack(this.state, packId);
    this.state = result.snapshot;
    return structuredClone(result);
  }
}
