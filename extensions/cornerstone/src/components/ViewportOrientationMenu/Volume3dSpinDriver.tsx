import React, { useEffect, useSyncExternalStore } from 'react';
import { useSystem } from '@ohif/core';
import { getVolume3dSpin, subscribeVolume3dSpin } from './viewport3dSpinStore';

const DEGREES_PER_SECOND_PER_SPIN = 18;

/**
 * Runs volume 3D spin animation from a viewport-attached node that stays mounted
 * while the Cornerstone viewport exists (unlike the orientation popover UI).
 */
export function Volume3dSpinDriver({ viewportId }: { viewportId: string }) {
  const { commandsManager } = useSystem();
  const spin = useSyncExternalStore(
    subscribeVolume3dSpin,
    () => getVolume3dSpin(viewportId),
    () => getVolume3dSpin(viewportId)
  );

  useEffect(() => {
    if (spin === 0) return;
    let lastTime = performance.now();
    let rafId: number;
    const tick = () => {
      const now = performance.now();
      const deltaMs = now - lastTime;
      lastTime = now;
      const angle = -spin * DEGREES_PER_SECOND_PER_SPIN * (deltaMs / 1000);
      commandsManager.runCommand('rotateViewport3DBy', {
        viewportId,
        angle,
      });
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [spin, viewportId, commandsManager]);

  return null;
}
