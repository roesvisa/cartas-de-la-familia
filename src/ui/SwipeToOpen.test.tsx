// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, it, expect, vi } from "vitest";
import { SwipeToOpen } from "./SwipeToOpen";
let root: Root, container: HTMLDivElement;
beforeEach(() => {
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
});
function render(open: () => Promise<boolean>) {
  act(() => root.render(<SwipeToOpen disabled={false} onOpen={open} />));
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
it("tracks progress and resets incomplete drags without spending", () => {
  const open = vi.fn(async () => true);
  render(open);
  pointer("pointerdown", 10);
  pointer("pointermove", 95);
  expect(
    (container.firstElementChild as HTMLElement).style.getPropertyValue(
      "--tear-progress",
    ),
  ).toBe("0.5");
  pointer("pointerup", 95);
  expect(open).not.toHaveBeenCalled();
  expect(
    (container.firstElementChild as HTMLElement).style.getPropertyValue(
      "--tear-progress",
    ),
  ).toBe("0");
});
it.each([
  [10, 190],
  [190, 10],
])("opens once after crossing the packet from %s to %s", async (a, b) => {
  const open = vi.fn(async () => true);
  render(open);
  pointer("pointerdown", a);
  await act(async () => {
    pointer("pointermove", b);
  });
  pointer("pointerup", b);
  act(() => container.querySelector("button")!.click());
  expect(open).toHaveBeenCalledTimes(1);
});
it("cancels vertical and interrupted gestures", () => {
  const open = vi.fn(async () => true);
  render(open);
  pointer("pointerdown", 10);
  pointer("pointermove", 180, 350);
  pointer("pointercancel", 180, 350);
  expect(open).not.toHaveBeenCalled();
});
it("allows retry after a failed opening", async () => {
  const open = vi.fn(async () => false);
  render(open);
  await act(async () => container.querySelector("button")!.click());
  expect(container.querySelector("button")!.disabled).toBe(false);
  expect(
    (container.firstElementChild as HTMLElement).style.getPropertyValue(
      "--tear-progress",
    ),
  ).toBe("0");
});
