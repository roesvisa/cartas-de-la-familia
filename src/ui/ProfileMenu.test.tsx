// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ProfileMenu } from './ProfileMenu';
import type { ProfileAuth } from '../application/profileAuth';
let root: Root, host: HTMLDivElement;
let auth: ProfileAuth, logout: ReturnType<typeof vi.fn>;
const button=(text:string)=>Array.from(document.querySelectorAll('button')).find(b=>b.textContent===text)!;
const click=async(b:HTMLElement)=>{await act(async()=>b.click());};
async function fill(label:string,value:string) {
 const field=Array.from(document.querySelectorAll('label')).find(l=>l.textContent?.startsWith(label))!;
 const input=(document.getElementById(field.htmlFor) ?? field.querySelector('input')) as HTMLInputElement; ;
 await act(async()=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value')!.set!.call(input,value);input.dispatchEvent(new Event('input',{bubbles:true}));});
}
async function openForm(){await click(host.querySelector('button')!);await click(button('Cambiar contraseña'));await fill('Contraseña actual','current-test');}
async function submit(){await act(async()=>document.querySelector('form')!.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));}
beforeEach(()=>{
 Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
 HTMLDialogElement.prototype.showModal=vi.fn(function(this:HTMLDialogElement){this.open=true;});
 HTMLDialogElement.prototype.close=vi.fn(function(this:HTMLDialogElement){this.open=false;});
 auth={changePassword:vi.fn().mockResolvedValue({}),reauthenticate:vi.fn().mockResolvedValue({})};logout=vi.fn().mockResolvedValue(undefined);
 host=document.createElement('div');document.body.append(host);root=createRoot(host);
 act(()=>root.render(<ProfileMenu user={{id:'one',name:'Nombre de prueba muy largo',initials:'NP'}} triggerClassName="avatar" auth={auth} onSignOut={logout}/>));
});
afterEach(()=>{act(()=>root.unmount());host.remove();vi.restoreAllMocks();});
it('toggles, shows profile and closes on outside pointer and Escape, restoring focus',async()=>{
 const trigger=host.querySelector('button')!;
 await click(trigger);expect(trigger.getAttribute('aria-expanded')).toBe('true');
 expect(document.querySelectorAll('[role="menuitem"]')).toHaveLength(2);
 expect(document.body.textContent).toContain('Nombre de prueba muy largo');
 await act(async()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})));
 expect(document.querySelector('[role="menu"]')).toBeNull();expect(document.activeElement).toBe(trigger);
 await click(trigger);await act(async()=>document.body.dispatchEvent(new Event('pointerdown',{bubbles:true})));
 expect(document.querySelector('[role="menu"]')).toBeNull();
 await click(trigger);await click(trigger);expect(document.querySelector('[role="menu"]')).toBeNull();
});
it('supports menu keyboard navigation and logout failure without losing session UI',async()=>{
 logout.mockRejectedValue(new Error('network'));await click(host.querySelector('button')!);
 await act(async()=>button('Cambiar contraseña').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true})));
 expect(document.activeElement).toBe(button('Cerrar sesión'));
 await click(button('Cerrar sesión'));expect(logout).toHaveBeenCalledTimes(1);expect(document.querySelector('[role="alert"]')?.textContent).toContain('No pudimos cerrar');
});
it('checks confirmation before contacting Auth and masks all password fields',async()=>{
 await openForm();await fill('Nueva contraseña','only-for-tests');await fill('Confirmar nueva','different-test');await submit();
 expect(auth.changePassword).not.toHaveBeenCalled();expect(document.querySelector('[role="alert"]')?.textContent).toContain('no coinciden');
 expect(document.querySelectorAll('input[type="password"]')).toHaveLength(3);
});
it('requests code only when required, retries with nonce and clears passwords on success',async()=>{
 vi.mocked(auth.changePassword).mockResolvedValueOnce({requiresReauthentication:true}).mockResolvedValueOnce({});
 await openForm();await fill('Nueva contraseña','only-for-tests');await fill('Confirmar nueva','only-for-tests');await submit();
 expect(auth.reauthenticate).toHaveBeenCalledTimes(1);
 await fill('Código','123456');await submit();
 expect(auth.changePassword).toHaveBeenLastCalledWith({password:'only-for-tests',currentPassword:'current-test',nonce:'123456'});
 expect(document.querySelector('[role="status"]')?.textContent).toContain('actualizó');expect(document.querySelector('input')).toBeNull();
 await click(button('Listo'));expect(document.querySelector('dialog')).toBeNull();expect(document.activeElement).toBe(host.querySelector('button'));
});
it('clears form after cancelling and reopening',async()=>{
 await openForm();await fill('Nueva contraseña','only-for-tests');
 await act(async()=>document.querySelector('dialog')!.dispatchEvent(new Event('cancel',{cancelable:true})));
 await openForm();expect(document.querySelector<HTMLInputElement>('input[autocomplete="new-password"]')!.value).toBe('');
});
it('handles failed code delivery and resend',async()=>{
 vi.mocked(auth.changePassword).mockResolvedValue({requiresReauthentication:true});
 vi.mocked(auth.reauthenticate).mockResolvedValueOnce({error:'No pudimos enviar el código.'}).mockResolvedValueOnce({});
 await openForm();await fill('Nueva contraseña','only-for-tests');await fill('Confirmar nueva','only-for-tests');await submit();
 expect(document.querySelector('[role="alert"]')?.textContent).toContain('No pudimos enviar');
 await click(button('Enviar código'));expect(auth.reauthenticate).toHaveBeenCalledTimes(2);expect(document.querySelector('[role="status"]')?.textContent).toContain('Enviamos');
});

it('toggles each password independently without submitting',async()=>{
 await openForm();
 const fields=Array.from(document.querySelectorAll<HTMLInputElement>('input'));
 expect(fields).toHaveLength(3);
 for (let i=0;i<fields.length;i++) {
   const toggle=fields[i].parentElement!.querySelector('button')!;
   await click(toggle);expect(fields[i].type).toBe('text');
   expect(fields.filter((_,j)=>j!==i).every(f=>f.type==='password')).toBe(true);
   await click(toggle);expect(fields[i].type).toBe('password');
 }
 expect(auth.changePassword).not.toHaveBeenCalled();
});
it('requires current password before submitting',async()=>{
 await openForm();await fill('Contraseña actual','');await submit();
 expect(auth.changePassword).not.toHaveBeenCalled();
 expect(document.querySelector('[role="alert"]')?.textContent).toContain('contraseña actual');
});
