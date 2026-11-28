import { resolveImageUrl } from '../data/imageUrls';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { KeyRound, LogOut } from 'lucide-react';
import type { User } from '../domain/models';
import type { ProfileAuth } from '../application/profileAuth';
import { PasswordChange } from './PasswordChange';
import s from './ProfileMenu.module.css';

export function ProfileMenu({ user, triggerClassName, auth, onSignOut }: {
  user: User; triggerClassName: string; auth?: ProfileAuth; onSignOut: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [failedAvatar, setFailedAvatar] = useState<string>();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [position, setPosition] = useState({ top: 0, right: 0, maxHeight: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const pending = useRef(false);
  const wasPasswordOpen = useRef(false);
  useEffect(() => {
    const restore = wasPasswordOpen.current && !passwordOpen;
    wasPasswordOpen.current = passwordOpen;
    if (!restore) return;
    trigger.current?.focus({ preventScroll: true });
    // Native dialog close may restore its previous (now removed) menu item.
    const timer = window.setTimeout(() => trigger.current?.focus({ preventScroll: true }), 0);
    return () => window.clearTimeout(timer);
  }, [passwordOpen]);
  const id = useId();
  const initials = user.initials || user.name.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  function close(restore = false) { setOpen(false); if (restore) trigger.current?.focus({ preventScroll: true }); }
  useLayoutEffect(() => {
    if (!open) return;
    const r = trigger.current!.getBoundingClientRect();
    const top = r.bottom + 8;
    setPosition({ top, right: Math.max(12, document.documentElement.clientWidth - r.right), maxHeight: Math.max(0, window.innerHeight - top - 16) });
    menu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node) && !trigger.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(true); } };
    const reposition = () => setOpen(false);
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', reposition);
    const scroller = trigger.current?.closest('main');
    scroller?.addEventListener('scroll', reposition);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', reposition);
      scroller?.removeEventListener('scroll', reposition);
    };
  }, [open]);
  return <>
    <button ref={trigger} type="button" className={triggerClassName} aria-label={`Perfil de ${user.name}`}
      aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { setError(''); setOpen(!open); }}
      onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); setOpen(true); } }}>
      {user.avatarUrl && failedAvatar !== user.avatarUrl
        ? <img className={s.profilePhoto} src={resolveImageUrl(user.avatarUrl)} alt="" onError={() => setFailedAvatar(user.avatarUrl)} />
        : <span className={s.initials} aria-hidden="true">{initials}</span>}
    </button>
    {open && createPortal(<div ref={menu} className={s.panel} style={position} onBlur={e => {
      if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget as Node) && e.relatedTarget !== trigger.current) setOpen(false);
    }}>
      <div className={s.identity}><span className={s.avatar} aria-hidden="true">{initials}</span><strong>{user.name}</strong></div>
      <div id={id} role="menu" aria-label="Opciones de perfil" onKeyDown={e => {
        const items = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
        const index = items.indexOf(document.activeElement as HTMLButtonElement);
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
          e.preventDefault();
          const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
          items[next]?.focus();
        }
      }}>
        <button role="menuitem" disabled={!auth || busy} onClick={() => { close(); setPasswordOpen(true); }}><KeyRound size={18} aria-hidden="true" />Cambiar contraseña</button>
        <button role="menuitem" disabled={busy} onClick={async () => {
          if (pending.current) return;
          pending.current = true; setBusy(true); setError('');
          try { await onSignOut(); } catch { setError('No pudimos cerrar la sesión. Revisa tu conexión e inténtalo de nuevo.'); }
          finally { pending.current = false; setBusy(false); }
        }}><LogOut size={18} aria-hidden="true" />{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
      </div>
      {!auth && <p className={s.note}>Cambio de contraseña no disponible en la demostración.</p>}
      {error && <p role="alert" className={s.error}>{error}</p>}
    </div>, document.body)}
    {passwordOpen && auth && <PasswordChange auth={auth} onClose={() => setPasswordOpen(false)} />}
  </>;
}
