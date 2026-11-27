import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, X } from 'lucide-react';
import type { ProfileAuth } from '../application/profileAuth';
import s from './ProfileMenu.module.css';

function PasswordField({ label, value, onChange, current = false, hint }: { label: string; value: string; onChange: (value: string) => void; current?: boolean; hint?: string }) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return <div><label htmlFor={id}>{label}</label><div className={s.passwordField}>
    <input id={id} type={visible ? 'text' : 'password'} autoFocus={current} autoComplete={current ? 'current-password' : 'new-password'} aria-describedby={hint} minLength={current ? undefined : 8} required value={value} onChange={e => onChange(e.target.value)} />
    <button type="button" className={s.visibility} aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
  </div></div>;
}

export function PasswordChange({ auth, onClose }: { auth: ProfileAuth; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [nonce, setNonce] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
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
      if (!currentPassword) { setError('Ingresa tu contraseña actual.'); return; }
      if (password.length < 8) { setError('Usa al menos 8 caracteres.'); return; }
      if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return; }
      pending.current = true; setBusy(true);
      try {
        const result = await auth.changePassword({ password, ...(needsCode ? { nonce: nonce.trim() } : {}), currentPassword });
        if (result.requiresReauthentication) { setNeedsCode(true); setNonce(''); await sendCode(); }
        else if (result.requiresCurrentPassword) { setError(result.error ?? 'Confirma tu contraseña actual.'); }
        else if (result.error) setError(result.error);
        else { setPassword(''); setConfirmation(''); setNonce(''); setCurrentPassword(''); setSuccess(true); }
      } catch { setError('No pudimos conectar. Inténtalo de nuevo.'); }
      finally { pending.current = false; setBusy(false); }
    }}>
      <p id={`${id}-hint`}>Usa al menos 8 caracteres.</p>
      <PasswordField label="Contraseña actual" current value={currentPassword} onChange={setCurrentPassword} />
      <PasswordField label="Nueva contraseña" value={password} onChange={setPassword} hint={`${id}-hint`} />
      <PasswordField label="Confirmar nueva contraseña" value={confirmation} onChange={setConfirmation} />
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
