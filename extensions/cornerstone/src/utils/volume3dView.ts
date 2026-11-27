import { vec3 } from 'gl-matrix';
import type { Types } from '@cornerstonejs/core';
import { getViewportAdapter } from '../services/ViewportService/adapter';

export type ViewDirection = 'S' | 'I' | 'R' | 'L' | 'A' | 'P';

/** Degrees per second for each step of the spin speed. */
export const SPIN_DEGREES_PER_SECOND = 18;

// Patient axes are LPS: +x left, +y posterior, +z superior. `offset` points from the
// focal point to the camera, so 'A' puts the camera anterior, looking posterior.
const VIEW_DIRECTIONS: Record<ViewDirection, { offset: vec3; viewUp: Types.Point3 }> = {
  S: { offset: [0, 0, 1], viewUp: [0, 1, 0] },
  I: { offset: [0, 0, -1], viewUp: [0, 1, 0] },
  R: { offset: [-1, 0, 0], viewUp: [0, 0, 1] },
  L: { offset: [1, 0, 0], viewUp: [0, 0, 1] },
  A: { offset: [0, -1, 0], viewUp: [0, 0, 1] },
  P: { offset: [0, 1, 0], viewUp: [0, 0, 1] },
};

/** The camera fields of a volume3d viewport, legacy or generic; undefined for other viewports. */
function getVolume3DCamera(viewport: Types.IViewport | undefined) {
  const adapter = viewport && getViewportAdapter(viewport);
  if (adapter?.getShape() !== 'volume3d') {
    return;
  }
  return { adapter, camera: adapter.getViewState() as Types.ICamera };
}

/** Moves the camera of a volume3d viewport to look from an anatomical direction. */
export function setVolume3DViewDirection(
  viewport: Types.IViewport | undefined,
  direction: ViewDirection
): void {
  const found = getVolume3DCamera(viewport);
  const view = VIEW_DIRECTIONS[direction];
  if (!found || !view) {
    return;
  }
  const { focalPoint, position } = found.camera;
  const distance = vec3.distance(position, focalPoint) || 1;
  const newPosition = vec3.scaleAndAdd(vec3.create(), focalPoint, view.offset, distance);
  found.adapter.setViewState({
    focalPoint,
    position: [...newPosition] as Types.Point3,
    viewUp: view.viewUp,
  });
  viewport?.render();
}

/**
 * Orbits the camera of a volume3d viewport about the patient superior (z) axis through
 * the focal point. Returns false when the viewport is not a volume3d viewport.
 */
export function rotateVolume3D(viewport: Types.IViewport | undefined, degrees: number): boolean {
  const found = getVolume3DCamera(viewport);
  if (!found) {
    return false;
  }
  const { focalPoint, position, viewUp } = found.camera;
  const radians = (degrees * Math.PI) / 180;
  const newPosition = vec3.rotateZ(vec3.create(), position, focalPoint, radians);
  const newViewUp = vec3.rotateZ(vec3.create(), viewUp, [0, 0, 0], radians);
  found.adapter.setViewState({
    focalPoint,
    position: [...newPosition] as Types.Point3,
    viewUp: [...newViewUp] as Types.Point3,
  });
  viewport?.render();
  return true;
}

const spinSpeeds = new Map<string, number>();
let frameId: number | undefined;
let lastTime = 0;
let getViewport: (viewportId: string) => Types.IViewport | undefined = () => undefined;

function spinTick(now: number) {
  const seconds = (now - lastTime) / 1000;
  lastTime = now;
  spinSpeeds.forEach((speed, viewportId) => {
    const degrees = -speed * SPIN_DEGREES_PER_SECOND * seconds;
    if (!rotateVolume3D(getViewport(viewportId), degrees)) {
      spinSpeeds.delete(viewportId);
    }
  });
  frameId = spinSpeeds.size ? requestAnimationFrame(spinTick) : undefined;
}

export function getVolume3DSpin(viewportId: string): number {
  return spinSpeeds.get(viewportId) ?? 0;
}

/**
 * Sets the spin speed of a volume3d viewport; 0 stops it. The spin stops by itself when
 * the viewport is gone or is no longer a volume3d viewport.
 */
export function setVolume3DSpin(
  viewportId: string,
  speed: number,
  viewportLookup: (viewportId: string) => Types.IViewport | undefined
): void {
  getViewport = viewportLookup;
  if (speed) {
    spinSpeeds.set(viewportId, speed);
  } else {
    spinSpeeds.delete(viewportId);
  }
  if (spinSpeeds.size && frameId === undefined) {
    lastTime = performance.now();
    frameId = requestAnimationFrame(spinTick);
  }
}
