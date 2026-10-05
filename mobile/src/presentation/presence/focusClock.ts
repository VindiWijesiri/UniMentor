let paused = false;

export function setFocusClockPaused(value: boolean) {
  paused = value;
}

export function isFocusClockPaused() {
  return paused;
}
