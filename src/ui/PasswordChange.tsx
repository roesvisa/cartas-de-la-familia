import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ProfileAuth } from '../application/profileAuth';
import s from './ProfileMenu.module.css';

export function PasswordChange({ auth, onClose }: { auth: ProfileAuth; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [nonce, setNonce] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [needsCurrent, setNeedsCurrent] = useState(false);
  const [needsCode, setNeedsCode] = useState(false);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
  async function sendCode() {
    const result = await auth.reauthenticate();
    setSent(!result.error);
    setError(result.error ?? '');
  }
  return createPortal(<dialog ref={dialog} className={s.dialog} aria-labelledby={`${id}-title`}
    onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) {
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
    } }}>
    <button type="button" className={s.close} aria-label="Cerrar cambio de contraseña" onClick={onClose}><X size={20} /></button>
    <h2 id={`${id}-title`}>Cambiar contraseña</h2>
    {success ? <><p role="status">Tu contraseña se actualizó correctamente.</p><button className={s.primary} onClick={onClose}>Listo</button></> :
    <form onSubmit={async e => {
      e.preventDefault();
      if (pending.current) return;
      setError('');
      if (password.length < 8) { setError('Usa al menos 8 caracteres.'); return; }
      if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
      pending.current = true; setBusy(true);
      try {
        const result = await auth.changePassword({ password, ...(needsCode ? { nonce: nonce.trim() } : {}), ...(needsCurrent ? { currentPassword } : {}) });
        if (result.requiresReauthentication) { setNeedsCode(true); setNonce(''); await sendCode(); }
        else if (result.requiresCurrentPassword) { setNeedsCurrent(true); setError(result.error ?? 'Confirma tu contraseña actual.'); }
        else if (result.error) setError(result.error);
        else { setPassword(''); setConfirmation(''); setNonce(''); setCurrentPassword(''); setSuccess(true); }
      } catch { setError('No pudimos conectar. Inténtalo de nuevo.'); }
      finally { pending.current = false; setBusy(false); }
    }}>
      <p id={`${id}-hint`}>Usa al menos 8 caracteres.</p>
      {needsCurrent && <label>Contraseña actual<input type="password" autoComplete="current-password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} /></label>}
      <label>Nueva contraseña<input autoFocus type="password" autoComplete="new-password" aria-describedby={`${id}-hint`} minLength={8} required value={password} onChange={e => setPassword(e.target.value)} /></label>
      <label>Confirmar nueva contraseña<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={e => setConfirmation(e.target.value)} /></label>
      {needsCode && <>
        <p role="status">{sent ? 'Enviamos un código a tu correo o teléfono de acceso. Ingrésalo para confirmar el cambio.' : 'Para proteger tu cuenta, confirma el cambio con un código de acceso.'}</p>
        <label>Código de verificación<input autoComplete="one-time-code" inputMode="numeric" required value={nonce} onChange={e => setNonce(e.target.value)} /></label>
        <button type="button" className={s.secondary} disabled={busy} onClick={async () => {
          if (pending.current) return;
          pending.current = true; setBusy(true); setError('');
          try { await sendCode(); } catch { setError('No pudimos enviar el código. Inténtalo de nuevo.'); }
          finally { pending.current = false; setBusy(false); }
        }}>{sent ? 'Enviar otro código' : 'Enviar código'}</button>
      </>}
      {error && <p role="alert" className={s.error}>{error}</p>}
      <button type="submit" className={s.primary} disabled={busy}>{busy ? 'Procesando…' : 'Guardar contraseña'}</button>
    </form>}
  </dialog>, document.body);
}
