import { it, expect } from "vitest";
import { isHorizontalSwipe } from "./swipe";
it("acepta desplazamientos horizontales en ambas direcciones", () => {
  expect(isHorizontalSwipe(85, 10)).toBe(true);
  expect(isHorizontalSwipe(-85, 10)).toBe(true);
});
it("ignora toques, movimientos cortos y desplazamientos verticales", () => {
  expect(isHorizontalSwipe(0, 0)).toBe(false);
  expect(isHorizontalSwipe(30, 4)).toBe(false);
  expect(isHorizontalSwipe(70, 140)).toBe(false);
});
