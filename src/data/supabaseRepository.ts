import type { SupabaseClient } from '@supabase/supabase-js';
import type { CollectionRepository } from './repository';
import type { Snapshot, OpenPackResult } from '../domain/models';
export class SupabaseCollectionRepository implements CollectionRepository {
  constructor(private client: SupabaseClient) {}
  async load(collectionId: string): Promise<Snapshot> {
    const { data, error } = await this.client.rpc('collection_snapshot', { cid: collectionId });
    if (error) throw new Error(error.code === '42501' ? 'Tu cuenta aún no tiene acceso a esta colección. Contacta a quien te invitó.' : 'No pudimos cargar tu colección. Comprueba tu conexión e inténtalo de nuevo.');
    return data as Snapshot;
  }
  async open(collectionId: string, packId: string): Promise<OpenPackResult> {
    const { data, error } = await this.client.rpc('open_pack', { cid: collectionId, pid: packId });
    if (error) throw new Error('No pudimos confirmar la apertura. Reintenta: tus cartas se guardan sin gastar el sobre dos veces.');
    return data as OpenPackResult;
  }
}
