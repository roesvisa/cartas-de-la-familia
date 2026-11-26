// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({
 listener: undefined as undefined | ((event:string, session:unknown)=>void),
 unsubscribe:vi.fn(),
 signOut:vi.fn().mockResolvedValue({error:null}),
}));
vi.mock('../data/supabaseClient', () => ({supabase:{auth:{signOut:auth.signOut,onAuthStateChange:vi.fn(callback=>{auth.listener=callback;return {data:{subscription:{unsubscribe:auth.unsubscribe}}};})}}}));
vi.mock('./App',()=>({App:({onSignOut}:{onSignOut:()=>Promise<void>})=> <div>Inventario privado<button onClick={()=>void onSignOut().catch(()=>{})}>Salir de prueba</button></div>}));
import { ConnectedApp } from './ConnectedApp';
let root:Root, element:HTMLDivElement;
beforeEach(()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true}); element=document.createElement('div'); document.body.append(element); root=createRoot(element);act(()=>root.render(<ConnectedApp/>));});
afterEach(()=>{act(()=>root.unmount());element.remove();});
it('waits for restored session before showing private UI',()=>{
 expect(element.textContent).toContain('Cargando tu sesión');
 expect(element.textContent).not.toContain('Inventario privado');
 act(()=>auth.listener?.('INITIAL_SESSION',{user:{id:'one'}}));
 expect(element.textContent).toContain('Inventario privado');
});
it('removes private UI on session loss and never offers demo credentials',()=>{
 act(()=>auth.listener?.('SIGNED_IN',{user:{id:'one'}}));
 act(()=>auth.listener?.('SIGNED_OUT',null));
 expect(element.textContent).not.toContain('Inventario privado');
 expect(element.textContent).toContain('Iniciar sesión');
 expect(element.textContent).not.toContain('familia123');
});

it('signs out through Supabase and shows Login after success',async()=>{
 act(()=>auth.listener?.('SIGNED_IN',{user:{id:'one'}}));
 await act(async()=>element.querySelector<HTMLButtonElement>('button')!.click());
 expect(auth.signOut).toHaveBeenCalledWith({scope:'local'});
 expect(element.textContent).toContain('Iniciar sesión');
 expect(element.textContent).not.toContain('Inventario privado');
});
it('retains the authenticated view if signout fails',async()=>{
 auth.signOut.mockResolvedValueOnce({error:new Error('offline')});
 act(()=>auth.listener?.('SIGNED_IN',{user:{id:'one'}}));
 await act(async()=>element.querySelector<HTMLButtonElement>('button')!.click());
 expect(element.textContent).toContain('Inventario privado');
});
