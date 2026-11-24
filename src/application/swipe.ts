/** Net horizontal distance across the packet; vertical gestures cannot tear it. */
export function tearProgress(dx: number, dy: number, width: number) {
  if (width <= 0 || Math.abs(dy) > Math.abs(dx) / 1.5) return 0;
  return Math.min(1, Math.abs(dx) / (width * 0.85));
}
export function isHorizontalSwipe(dx: number, dy: number) {
  return Math.abs(dx) >= 60 && Math.abs(dx) > Math.abs(dy) * 1.5;
}
