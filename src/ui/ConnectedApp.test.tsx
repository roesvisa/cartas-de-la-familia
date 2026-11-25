// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({
 listener: undefined as undefined | ((event:string, session:unknown)=>void),
 unsubscribe:vi.fn(),
}));
vi.mock('../data/supabaseClient', () => ({supabase:{auth:{onAuthStateChange:vi.fn(callback=>{auth.listener=callback;return {data:{subscription:{unsubscribe:auth.unsubscribe}}};})}}}));
vi.mock('./App',()=>({App:()=> <div>Inventario privado</div>}));
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
