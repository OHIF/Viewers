const spinByViewportId = new Map<string, number>();
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

export function getVolume3dSpin(viewportId: string): number {
  return spinByViewportId.get(viewportId) ?? 0;
}

export function setVolume3dSpin(viewportId: string, spin: number) {
  if (spin === 0) {
    spinByViewportId.delete(viewportId);
  } else {
    spinByViewportId.set(viewportId, spin);
  }
  notify();
}

export function subscribeVolume3dSpin(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
