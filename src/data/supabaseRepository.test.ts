import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseCollectionRepository } from './supabaseRepository';
import { createFixture } from './fixtures';
describe('remote repository', () => {
 it('uses the same pack id on retries and never draws locally', async () => {
  const response = {snapshot:createFixture(), revealed:[]};
  const rpc = vi.fn().mockResolvedValue({data:response,error:null});
  const repo = new SupabaseCollectionRepository({rpc} as unknown as SupabaseClient);
  expect(await repo.open('family','pack')).toEqual(response);
  await repo.open('family','pack');
  expect(rpc.mock.calls).toEqual([['open_pack',{cid:'family',pid:'pack'}],['open_pack',{cid:'family',pid:'pack'}]]);
 });
 it('does not fall back to demo data when access is denied', async () => {
  const rpc=vi.fn().mockResolvedValue({data:null,error:{code:'42501'}});
  await expect(new SupabaseCollectionRepository({rpc} as unknown as SupabaseClient).load('family')).rejects.toThrow('no tiene acceso');
 });
});
