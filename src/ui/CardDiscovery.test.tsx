// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { CardDiscovery } from "./CardDiscovery";
import { createFixture } from "../data/fixtures";
let container: HTMLDivElement, root: Root;
beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  HTMLElement.prototype.setPointerCapture = vi.fn();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(<CardDiscovery card={createFixture().cards[0]} />));
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.useRealTimers();
});
function pointer(type: string) {
  const event = new MouseEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
  });
  Object.defineProperties(event, {
    isPrimary: { value: true },
    pointerType: { value: "touch" },
    pointerId: { value: 1 },
  });
  act(() => container.querySelector("button")!.dispatchEvent(event));
}
function loadPhoto() {
  act(() =>
    container.querySelectorAll("img")[1].dispatchEvent(new Event("load")),
  );
}
function photo() {
  return container.querySelectorAll("img")[1] as HTMLImageElement;
}
it("reveals on sustained touch and restores on release", () => {
  loadPhoto();
  pointer("pointerdown");
  act(() => vi.advanceTimersByTime(220));
  expect(photo().style.opacity).toBe("1");
  pointer("pointerup");
  expect(photo().style.opacity).toBe("0");
});
it("remembers a hold started before the real image loads", () => {
  pointer("pointerdown");
  act(() => vi.advanceTimersByTime(220));
  expect(photo().style.opacity).toBe("0");
  loadPhoto();
  expect(photo().style.opacity).toBe("1");
  pointer("pointerup");
  expect(photo().style.opacity).toBe("0");
});
it("late image loading does not reveal after release", () => {
  pointer("pointerdown");
  act(() => vi.advanceTimersByTime(220));
  pointer("pointerup");
  loadPhoto();
  expect(photo().style.opacity).toBe("0");
});
it("cancellation restores the drawing", () => {
  loadPhoto();
  pointer("pointerdown");
  act(() => vi.advanceTimersByTime(220));
  pointer("pointercancel");
  expect(photo().style.opacity).toBe("0");
});
it("keyboard hold reveals until key release", () => {
  loadPhoto();
  const button = container.querySelector("button")!;
  act(() =>
    button.dispatchEvent(
      new KeyboardEvent("keydown", { key: " ", bubbles: true }),
    ),
  );
  act(() => vi.advanceTimersByTime(220));
  expect(photo().style.opacity).toBe("1");
  act(() =>
    button.dispatchEvent(
      new KeyboardEvent("keyup", { key: " ", bubbles: true }),
    ),
  );
  expect(photo().style.opacity).toBe("0");
});
