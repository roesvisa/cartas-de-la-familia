/** A release/cancellation always wins, including before the hold threshold. */
export function createHoldToReveal(
  onChange: (revealed: boolean) => void,
  delay = 220,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let active = false;
  return {
    start() {
      if (active) return;
      active = true;
      timer = setTimeout(() => {
        timer = undefined;
        if (active) onChange(true);
      }, delay);
    },
    stop() {
      active = false;
      clearTimeout(timer);
      timer = undefined;
      onChange(false);
    },
  };
}
