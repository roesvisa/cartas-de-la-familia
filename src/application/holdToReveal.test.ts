import { afterEach, expect, it, vi } from "vitest";
import { createHoldToReveal } from "./holdToReveal";
afterEach(() => vi.useRealTimers());
it("reveals only after a sustained hold, then restores immediately on release", () => {
  vi.useFakeTimers();
  const changed = vi.fn();
  const hold = createHoldToReveal(changed);
  hold.start();
  vi.advanceTimersByTime(219);
  expect(changed).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1);
  expect(changed).toHaveBeenLastCalledWith(true);
  hold.stop();
  expect(changed).toHaveBeenLastCalledWith(false);
});
it("short taps and cancellation never reveal later", () => {
  vi.useFakeTimers();
  const changed = vi.fn();
  const hold = createHoldToReveal(changed);
  hold.start();
  vi.advanceTimersByTime(100);
  hold.stop();
  vi.runAllTimers();
  expect(changed.mock.calls).toEqual([[false]]);
});
it("repeated starts cannot leave a pending reveal after release", () => {
  vi.useFakeTimers();
  const changed = vi.fn();
  const hold = createHoldToReveal(changed);
  hold.start();
  hold.start();
  hold.stop();
  vi.runAllTimers();
  expect(changed).not.toHaveBeenCalledWith(true);
  hold.start();
  vi.advanceTimersByTime(220);
  expect(changed).toHaveBeenLastCalledWith(true);
});
