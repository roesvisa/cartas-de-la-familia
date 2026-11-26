import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createProfileAuth } from './profileAuth';
function setup(error: { code: string; message?: string } | null) {
  const auth = { updateUser: vi.fn().mockResolvedValue({ error }), reauthenticate: vi.fn().mockResolvedValue({ error: null }) };
  return { auth, service: createProfileAuth({ auth } as unknown as SupabaseClient) };
}
it('updates only through Auth with optional reauthentication nonce', async () => {
  const {auth,service}=setup(null);
  expect(await service.changePassword({password:'test-only-secret',nonce:'123456'})).toEqual({});
  expect(auth.updateUser).toHaveBeenCalledWith({password:'test-only-secret',nonce:'123456'});
  expect(await service.reauthenticate()).toEqual({});
  expect(auth.reauthenticate).toHaveBeenCalledTimes(1);
});
it('reports reauthentication and current-password requirements',async()=>{
  expect(await setup({code:'reauthentication_needed'}).service.changePassword({password:'test-only'})).toEqual({requiresReauthentication:true});
  expect((await setup({code:'current_password_required'}).service.changePassword({password:'test-only'})).requiresCurrentPassword).toBe(true);
});
it.each(['weak_password','same_password','reauthentication_not_valid','session_not_found','unknown'])('provides safe errors for %s without echoing server content',async(code)=>{
  const result=await setup({code,message:'sensitive server payload'}).service.changePassword({password:'test-only'});
  expect(result.error).toBeTruthy(); expect(result.error).not.toContain('sensitive');
});
it('handles connection errors and failed code delivery',async()=>{
  const {auth,service}=setup(null);
  auth.updateUser.mockRejectedValue(new Error('network'));
  auth.reauthenticate.mockRejectedValue(new Error('network'));
  expect((await service.changePassword({password:'test-only'})).error).toBeTruthy();
  expect((await service.reauthenticate()).error).toBeTruthy();
});
