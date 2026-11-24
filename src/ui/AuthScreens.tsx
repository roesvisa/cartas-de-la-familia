import { useState } from "react";
import { Mail, LockKeyhole, Eye, EyeOff } from "lucide-react";
import { login, DEMO_EMAIL, DEMO_PASSWORD } from "../data/mockSession";
import { Button, Title } from "./Components";
import s from "./App.module.css";
export function Welcome({ onEnter }: { onEnter: () => void }) {
  return (
    <section className={s.welcome}>
      <img src="./figma/a7854.svg" alt="Ilustración de cartas coleccionables" />
      <h1>
        Tu colección
        <br />
        empieza aquí
      </h1>
      <p>
        Abre sobres, descubre cartas
        <br />y completa la colección familiar.
      </p>
      <Button onClick={onEnter}>Ingresar</Button>
    </section>
  );
}
export function Login({
  onBack,
  onSuccess,
}: {
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <section className={s.login}>
      <Title back={onBack}>Iniciar sesión</Title>
      <p>Entra a tu colección con los datos que recibiste por invitación.</p>
      <form
        className={s.loginForm}
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            await login(email, password);
            onSuccess();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>Tus datos de acceso</h2>
        <label htmlFor="email">Correo electrónico</label>
        <div className={s.field}>
          <Mail size={22} />
          <input
            id="email"
            type="email"
            autoComplete="username"
            placeholder="correo@ejemplo.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <label htmlFor="password">Contraseña</label>
        <div className={s.field}>
          <LockKeyhole size={22} />
          <input
            id="password"
            type={visible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {visible ? <EyeOff /> : <Eye />}
          </button>
        </div>
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
        <Button disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
      </form>
      <p className={s.demo}>
        Acceso de demostración
        <br />
        {DEMO_EMAIL} · {DEMO_PASSWORD}
      </p>
    </section>
  );
}
