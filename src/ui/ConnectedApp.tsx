import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../data/supabaseClient';
import { SupabaseCollectionRepository } from '../data/supabaseRepository';
import { App } from './App';
import { Login, Welcome } from './AuthScreens';
import { Button, Title } from './Components';
import s from './App.module.css';
import { createProfileAuth } from '../data/profileAuth';
const profileAuth = createProfileAuth(supabase);
const repository = new SupabaseCollectionRepository(supabase);
const invitation = ['invite', 'recovery'].includes(new URLSearchParams(location.hash.slice(1)).get('type') ?? '');
export function ConnectedApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [enter, setEnter] = useState(false);
  const [setPassword, setSetPassword] = useState(invitation);
  const [password, setPasswordValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      setLoading(false);
      if (event === 'PASSWORD_RECOVERY') setSetPassword(true);
      if (event === 'SIGNED_OUT') { setEnter(true); setSetPassword(false); }
    });
    return () => subscription.unsubscribe();
  }, []);
  async function signOut() {
    setError('');
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw new Error('No se pudo cerrar la sesión. Inténtalo de nuevo.');
    setSession(null);
    setEnter(true);
  }
  if (loading) return <div className={s.app}><p className={s.status} role="status">Cargando tu sesión…</p></div>;
  if (session && !setPassword) return <><App key={session.user.id} repository={repository} authenticated onSignOut={signOut} profileAuth={profileAuth} />{error && <p role="alert">{error}</p>}</>;
  return <div className={s.app}><main className={s.main}>
    {session && setPassword ? <section className={s.login}>
      <Title>Tu contraseña</Title>
      <p>Elige una contraseña para entrar a tu colección.</p>
      <form className={s.loginForm} onSubmit={async e => {
        e.preventDefault(); if (busy) return; setBusy(true); setError('');
        const { error } = await supabase.auth.updateUser({ password });
        setBusy(false);
        if (error) setError('No pudimos guardar la contraseña. Usa al menos 8 caracteres o solicita una nueva invitación.');
        else { setPasswordValue(''); setSetPassword(false); }
      }}>
        <label htmlFor="new-password">Nueva contraseña</label>
        <div className={s.field}><input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPasswordValue(e.target.value)} /></div>
        {error && <p role="alert">{error}</p>}
        <Button disabled={busy}>{busy ? 'Guardando…' : 'Guardar y entrar'}</Button>
      </form>
    </section> : enter || invitation ? <Login demo={false} onBack={() => setEnter(false)} onSuccess={() => {}} authenticate={async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw new Error('No pudimos iniciar sesión. Revisa tu correo, contraseña y conexión.');
    }} /> : <Welcome onEnter={() => setEnter(true)} />}
  </main></div>;
}
