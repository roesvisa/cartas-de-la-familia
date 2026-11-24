// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { FlipCard } from "./FlipCard";
import { createFixture } from "../data/fixtures";
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  HTMLElement.prototype.setPointerCapture = vi.fn();
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    width: 200,
  } as DOMRect);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
function render(onReveal: () => void) {
  act(() => root.render(<FlipCard card={createFixture().cards[0]} index={0} revealed={false} onReveal={onReveal} />));
}
function pointer(type: string, x: number, y = 100) {
  const e = new MouseEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
    button: 0,
  });
  Object.defineProperties(e, {
    isPrimary: { value: true },
    pointerId: { value: 1 },
  });
  act(() => container.querySelector("button")!.dispatchEvent(e));
}
it.each([[10,190],[190,10]])("gira en ambos sentidos y descubre una sola vez (%s → %s)", (a,b) => {
  const reveal = vi.fn(); render(reveal);
  pointer("pointerdown",a); pointer("pointermove",b);
  expect(reveal).not.toHaveBeenCalled();
  pointer("pointerup",b);
  act(() => container.querySelector('button')!.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})));
  act(() => vi.runAllTimers());
  expect(reveal).toHaveBeenCalledTimes(1);
});
it("sigue el dedo y vuelve al dorso si se suelta antes", () => {
 const reveal = vi.fn(); render(reveal);
 pointer('pointerdown',10); pointer('pointermove',95);
 expect(container.querySelector('span')!.style.transform).toBe('rotateY(90deg)');
 pointer('pointerup',95);
 act(() => container.querySelector('button')!.dispatchEvent(new MouseEvent('click',{bubbles:true,detail:1})));
 act(() => vi.runAllTimers());
 expect(reveal).not.toHaveBeenCalled();
 expect(container.querySelector('span')!.style.transform).toBe('rotateY(0deg)');
});
it("cancela desplazamientos verticales y gestos interrumpidos", () => {
 const reveal = vi.fn(); render(reveal);
 pointer('pointerdown',10); pointer('pointermove',190,350); pointer('pointercancel',190,350);
 act(() => vi.runAllTimers()); expect(reveal).not.toHaveBeenCalled();
});
it("conserva apertura por toque o teclado", () => {
 const reveal = vi.fn(); render(reveal);
 act(() => container.querySelector('button')!.click());
 act(() => vi.runAllTimers()); expect(reveal).toHaveBeenCalledTimes(1);
});
it("cancela el callback al desmontar durante el giro", () => {
 const reveal = vi.fn(); render(reveal);
 act(() => container.querySelector('button')!.click());
 act(() => root.render(null));
 act(() => vi.runAllTimers()); expect(reveal).not.toHaveBeenCalled();
});

it.each([1,-1])("completa automáticamente al cruzar el canto en dirección %s", (direction) => {
 const reveal = vi.fn(); render(reveal);
 pointer('pointerdown',100);
 pointer('pointermove',100 + direction * 85);
 expect(container.querySelector('span')!.style.transform).toBe(`rotateY(${direction * 90}deg)`);
 expect(reveal).not.toHaveBeenCalled();
 pointer('pointermove',100 + direction * 86);
 expect(container.querySelector('span')!.style.transform).toBe(`rotateY(${direction * 180}deg)`);
 // Once committed, retreating or cancelling cannot expose a partial face.
 pointer('pointermove',100); pointer('pointercancel',100);
 act(() => vi.runAllTimers());
 expect(reveal).toHaveBeenCalledTimes(1);
});
