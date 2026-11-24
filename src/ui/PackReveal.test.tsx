// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { expect, it, vi } from "vitest";
import { PackReveal } from "./PackReveal";
import { createFixture } from "../data/fixtures";
import s from "./App.module.css";
it.each([true, false])("usa la acción principal correcta con sobres disponibles=%s", (available) => {
  Object.assign(globalThis, {IS_REACT_ACT_ENVIRONMENT: true});
  vi.useFakeTimers();
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
  const container = document.createElement('div');
  const root = createRoot(container);
  const onCollection = vi.fn();
  const onHome = vi.fn();
  try {
    act(() => root.render(<PackReveal cards={createFixture().cards.slice(0,3).map(card => ({card, duplicate:false}))} available={available} onAlbum={onCollection} onHome={onHome} onNext={() => {}} />));
    for (let i=1;i<=3;i++) {
      act(() => container.querySelector<HTMLButtonElement>(`[aria-label="Revelar carta ${i}"]`)!.click());
      act(() => vi.runAllTimers());
      act(() => container.querySelector<HTMLButtonElement>('[aria-label="Cerrar carta y continuar"]')!.click());
    }
    const collection = [...container.querySelectorAll('button')].find(b => b.textContent === 'Ver mi colección')!;
    expect(collection.classList.contains(s.cta)).toBe(!available);
    expect(container.textContent?.includes('Abrir siguiente sobre')).toBe(available);
    act(() => collection.click());
    expect(onCollection).toHaveBeenCalledTimes(1);
    const home = [...container.querySelectorAll('button')].find(b => b.textContent === 'Ir al Home');
    expect(Boolean(home)).toBe(!available);
    if (home) {
      expect(home.classList.contains(s.textButton)).toBe(true);
      act(() => home.click());
      expect(onHome).toHaveBeenCalledTimes(1);
    }
  } finally {
    act(() => root.unmount());
    vi.useRealTimers();
    vi.restoreAllMocks();
  }
});
