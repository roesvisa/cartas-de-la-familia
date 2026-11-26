import { useState, useEffect, useRef } from "react";
import {
  Search,
  LockKeyhole,
  CalendarDays,
} from "lucide-react";
import type { CollectionRepository } from "../data/repository";
import { COLLECTION_ID } from "../data/fixtures";
import { useCollection } from "../application/useCollection";
import { progress, ranking } from "../domain/collection";
import type { Card } from "../domain/models";
import {
  Button,
  Logo,
  Title,
  Navigation,
  EmptyState,
  Back,
} from "./Components";
import type { Page } from "./Components";
import { Welcome, Login } from "./AuthScreens";
import { CardDiscovery } from "./CardDiscovery";
import { CardTile } from "./CardTile";
import { SwipeToOpen } from "./SwipeToOpen";
import { PackCountdown } from "./PackCountdown";
import { PackReveal } from "./PackReveal";
import { RankingBoard } from "./RankingBoard";
import { CollectionSummary } from "./CollectionSummary";
import { ProfileMenu } from "./ProfileMenu";
import type { ProfileAuth } from "../application/profileAuth";
import { useTheme } from "../theme/ThemeProvider";
import { SeasonalSnowflakes, SeasonalBadge, SeasonalRibbon } from "./SeasonalDecorations";
import s from "./App.module.css";
export function App({ repository, authenticated = false, onSignOut, profileAuth }: { repository: CollectionRepository; authenticated?: boolean; onSignOut?: () => Promise<void>; profileAuth?: ProfileAuth }) {
  const festive = useTheme() === "navidad";
  const [session, setSession] = useState<"welcome" | "login" | "signed">(
    authenticated ? "signed" : "welcome",
  );
  const [page, setPage] = useState<Page>("inicio"),
    [openingPage, setOpeningPage] = useState(false),
    [filter, setFilter] = useState("Todas"),
    [query, setQuery] = useState(""),
    [detail, setDetail] = useState<Card | null>(null);
  const model = useCollection(repository, COLLECTION_ID);
  useEffect(() => {
    if (!authenticated) return;
    const refresh = () => { if (document.visibilityState === 'visible') void model.refresh(); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [authenticated, model.refresh]);
  const main = useRef<HTMLElement>(null);
  const [openingPhase, setOpeningPhase] = useState<
    "idle" | "opening" | "revealing"
  >("idle");
  const animationBusy = useRef(false);
  const mounted = useRef(true);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(fadeTimer.current);
    };
  }, []);
  async function animateOpen(): Promise<boolean> {
    if (animationBusy.current) return false;
    animationBusy.current = true;
    setOpeningPhase("opening");
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const [success] = await Promise.all([
      model.open(),
      new Promise((resolve) => setTimeout(resolve, reduced ? 120 : 850)),
    ]);
    if (!mounted.current) return success;
    if (!success) {
      setOpeningPhase("idle");
      animationBusy.current = false;
      return false;
    }
    setOpeningPhase("revealing");
    fadeTimer.current = setTimeout(
      () => {
        setOpeningPhase("idle");
        animationBusy.current = false;
      },
      reduced ? 120 : 450,
    );
    return true;
  }
  useEffect(() => {
    main.current?.focus();
  }, [page, session, openingPage]);
  const data = model.snapshot,
    inv = data?.inventories.find(
      (i) => i.userId === data.user.id && i.collectionId === data.collection.id,
    );
  const stats = progress(data?.cards ?? [], inv),
    available = data?.packs.filter((p) => p.status === "available").length ?? 0;
  const rows = data ? ranking(data).filter((r) => r.unique > 0) : [];
  function navigate(p: Page) {
    if (authenticated) void model.refresh();
    setPage(p);
    setDetail(null);
    setOpeningPage(false);
    model.closeReveal();
  }
  function start() {
    model.closeReveal();
    setOpeningPage(true);
  }
  const quantity = (card: Card) => inv?.quantities[card.id] ?? 0;
  const filtered =
    data?.cards.filter(
      (c) =>
        (filter === "Todas" || (c.category === filter && quantity(c) > 0)) &&
        c.title.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")),
    ) ?? [];
  return (
    <div className={`${s.app} ${festive ? s.seasonalCanvas : ""} ${session === "signed" && !openingPage && !model.revealed.length && !detail ? s.collectionCanvas : ""}`}>
      {session === "signed" && !openingPage && !model.revealed.length && !detail && <SeasonalSnowflakes />}
      {openingPhase !== "idle" && (
        <div
          aria-hidden="true"
          className={s.openingFlash}
          data-phase={openingPhase}
        />
      )}
      <main ref={main} tabIndex={-1} className={s.main}>
        {session === "welcome" ? (
          <Welcome onEnter={() => setSession("login")} />
        ) : session === "login" ? (
          <Login
            onBack={() => setSession("welcome")}
            onSuccess={() => setSession("signed")}
          />
        ) : model.loading ? (
          <p className={s.status} role="status">
            Cargando tu colección…
          </p>
        ) : !data ? (
          <div className={s.status} role="alert">
            <p>{model.error}</p>
            <Button onClick={model.reload}>Reintentar</Button>
            {onSignOut && <button type="button" onClick={() => { void onSignOut().catch(() => {}); }} className={s.logout}>Cerrar sesión</button>}
          </div>
        ) : model.revealed.length && openingPhase !== "opening" ? (
          <PackReveal
            key={data.packs.filter((p) => p.status === "opened").length}
            cards={model.revealed}
            available={available > 0}
            onAlbum={() => navigate("album")}
            onHome={() => navigate("inicio")}
            onNext={start}
          />
        ) : openingPage ? (
          <section className={s.opening}>
            <Title
              back={
                openingPhase === "idle" ? () => navigate("inicio") : undefined
              }
            >
              Abre tu sobre
            </Title>
            <p>
              Descubre <b>3</b> nuevas cartas
            </p>
            <SwipeToOpen
              disabled={model.opening || !available}
              onOpen={animateOpen}
            />
            <p role="status">
              {model.opening
                ? "Abriendo…"
                : "Desliza de un borde al otro para rasgar, o toca el sobre"}
            </p>
            {model.error && <p role="alert">{model.error}</p>}
          </section>
        ) : detail ? (
          <section className={s.detail}>
            <Back onClick={() => setDetail(null)} />
            <h1>{detail.title}</h1>
            <CardDiscovery key={detail.id} card={detail} />
            <div className={s.detailInfo}>
              <p>
                Una integrante de la colección familiar.
                <br />
                Carta de ejemplo para el MVP.
              </p>
              <div>
                <span>{detail.category}</span>
                <span>
                  {quantity(detail)} copia{quantity(detail) === 1 ? "" : "s"}
                </span>
                <b>N° {String(detail.number).padStart(2, "0")}</b>
              </div>
            </div>
          </section>
        ) : (
          <>
            {model.error && <p role="alert">{model.error}</p>}
            {page === "inicio" && (
              <section className={s.home}>
                <header className={s.homeHeader}>
                  <Logo />
                  <ProfileMenu user={data.user} triggerClassName={s.profile} auth={profileAuth}
                    onSignOut={onSignOut ?? (async () => setSession("login"))} />
                  <img className={s.ghostCards} src="./figma/4b57a.svg" alt="" />
                  <h1>¡Hola, {data.user.name}!</h1>
                </header>
                <CollectionSummary
                  unique={stats.unique}
                  capacity={stats.total}
                  ownedTotal={stats.ownedTotal}
                  rank={stats.unique ? rows.findIndex((r) => r.id === data.user.id) + 1 : 0}
                  onRanking={() => navigate("ranking")}
                />
                <section className={`${s.packPanel} ${festive ? s.seasonalPackPanel : ""}`}>
                  <SeasonalRibbon />
                  <h2>Sobres disponibles</h2>
                  <span className={s.pill}>
                    <b>{available}</b> de 3
                  </span>
                  <div className={s.packSlots}>
                    {[0, 1, 2].map((i) =>
                      i < available ? (
                        <img
                          key={i}
                          src="./figma/1bbb6.png"
                          alt={`Sobre disponible ${i + 1}`}
                        />
                      ) : (
                        <div
                          key={i}
                          className={s.lockedPack}
                          aria-label="Espacio sin sobre"
                        >
                          <LockKeyhole />
                        </div>
                      ),
                    )}
                  </div>
                  <Button onClick={start} disabled={!available}>
                    {available
                      ? available === 3
                        ? "Abrir sobres"
                        : "Abrir sobre"
                      : "Sin sobres por abrir"}
                  </Button>
                  {authenticated && available < 3 && data.nextPackAt && data.serverNow && (
                    <PackCountdown nextPackAt={data.nextPackAt} serverNow={data.serverNow} onReady={model.refresh} />
                  )}
                  {!authenticated && available < 3 && (
                    <p className={s.timer}>
                      <CalendarDays size={18} /> Próximo sobre diario: simulado
                    </p>
                  )}
                </section>
              </section>
            )}
            {page === "album" && (
              <section className={s.album}>
                {festive ? <div className={s.seasonalTitle}><h1>Mi colección</h1><SeasonalBadge /></div> : <h1>Mi colección</h1>}
                <CollectionSummary
                  unique={stats.unique}
                  capacity={stats.total}
                  ownedTotal={stats.ownedTotal}
                />
                <label className={s.search}>
                  <Search size={22} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nombre…"
                    aria-label="Buscar por nombre"
                  />
                </label>
                <div className={s.filters} aria-label="Filtrar por rareza">
                  {["Todas", "Común", "Rara", "Especial"].map((f) => (
                    <button
                      key={f}
                      aria-pressed={filter === f}
                      onClick={() => setFilter(f)}
                    >
                      {f === "Todas"
                        ? f
                        : {
                            Común: "Comunes",
                            Rara: "Raras",
                            Especial: "Especiales",
                          }[f]}{" "}
                      {f !== "Todas" &&
                        `(${data.cards.filter((c) => c.category === f && quantity(c) > 0).length})`}
                    </button>
                  ))}
                </div>
                {!stats.unique && !query && filter === "Todas" ? (
                  <EmptyState available={available > 0} onOpen={start} />
                ) : filtered.length ? (
                  <div className={s.albumGrid}>
                    {filtered.map((card) => (
                      <CardTile
                        key={card.id}
                        card={card}
                        quantity={quantity(card)}
                        onClick={() => setDetail(card)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className={s.noResults} role="status">
                    No hay cartas para este filtro.
                  </p>
                )}
              </section>
            )}
            {page === "ranking" && (
              <section className={s.ranking}>
                <Title>Ranking</Title>
                {rows.length ? (
                  <RankingBoard rows={rows} currentUserId={data.user.id} />
                ) : (
                  <EmptyState
                    ranking
                    available={available > 0}
                    onOpen={start}
                  />
                )}
              </section>
            )}
          </>
        )}
      </main>
      {session === "signed" &&
        data &&
        !openingPage &&
        !model.revealed.length &&
        !detail && <Navigation page={page} onChange={navigate} />}
    </div>
  );
}
