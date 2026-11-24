import type { ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft, House, Grid2X2, Trophy } from "lucide-react";
import s from "./App.module.css";
export function Button({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${s.cta} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function Logo() {
  return (
    <div className={s.logo} aria-label="Cartas de la Familia">
      <img src="./figma/39744.svg" alt="" />
      <img className={s.logoLeft} src="./figma/d36fa.svg" alt="" />
      <img className={s.logoRight} src="./figma/a3bd6.svg" alt="" />
    </div>
  );
}
export function Back({ onClick }: { onClick: () => void }) {
  return (
    <button className={s.back} onClick={onClick} aria-label="Volver">
      <ChevronLeft />
    </button>
  );
}
export function Title({
  children,
  back,
}: {
  children: ReactNode;
  back?: () => void;
}) {
  return (
    <header className={s.title}>
      {back && <Back onClick={back} />}
      <Logo />
      <h1>{children}</h1>
    </header>
  );
}
export type Page = "inicio" | "album" | "ranking";
export function Navigation({
  page,
  onChange,
}: {
  page: Page;
  onChange: (p: Page) => void;
}) {
  return (
    <nav className={s.nav} aria-label="Navegación principal">
      {(
        [
          { id: "inicio", label: "Inicio", Icon: House },
          { id: "album", label: "Colección", Icon: Grid2X2 },
          { id: "ranking", label: "Ranking", Icon: Trophy },
        ] as const
      ).map(({ id, label, Icon }) => (
        <button
          key={id}
          aria-current={page === id ? "page" : undefined}
          onClick={() => onChange(id)}
        >
          <Icon size={26} />
          {label}
        </button>
      ))}
    </nav>
  );
}
export function EmptyState({
  ranking = false,
  onOpen,
  available,
}: {
  ranking?: boolean;
  onOpen: () => void;
  available: boolean;
}) {
  return (
    <section className={s.empty}>
      <img src="./figma/1bbb6.png" alt="Sobre de cartas" />
      <h2>
        <em>{ranking ? "¡Sé el primero" : "¡Tu colección"}</em>
        <br />
        {ranking ? "en el ranking!" : "comienza aquí!"}
      </h2>
      <p>
        {ranking
          ? "Todavía no hay coleccionistas en la lista."
          : "Tu colección todavía está vacía."}
        <br />
        Abre un sobre y consigue tus primeras cartas.
      </p>
      <Button onClick={onOpen} disabled={!available}>
        {available ? "Abrir sobres" : "Sin sobres por abrir"}
      </Button>
    </section>
  );
}
