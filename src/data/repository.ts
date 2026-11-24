import type { OpenPackResult, Snapshot } from "../domain/models";
/** UI depends on this contract; a future remote adapter owns auth and atomic draws. */
export interface CollectionRepository {
  load(collectionId: string): Promise<Snapshot>;
  open(collectionId: string, packId: string): Promise<OpenPackResult>;
}
