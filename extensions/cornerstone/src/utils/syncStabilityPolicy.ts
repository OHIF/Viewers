import { selectStability, shallowEqual } from '@ohif/core';

/**
 * Installs the stability-gated sync policy: synchronizers are suspended while
 * the viewport grid is unstable (any content viewport has not yet rendered its
 * current composition) and resumed once every viewport has rendered.
 *
 * The handler is a stability MIRROR rather than an epoch latch: the grid store
 * carries the runtime phase forward across display-set swaps, so instability
 * can arrive as a second notification (when the mount pipeline invalidates the
 * runtime entry), not necessarily in the same notification as the epoch bump.
 * Mirroring isStable into suspendAll/resumeAll covers both orderings; both
 * calls are idempotent by SyncGroupService design. The epoch is kept in the
 * handler only for the debug log line.
 *
 * @returns an uninstall function that unsubscribes and resumes synchronizers.
 */
export function installSyncStabilityPolicy({
  servicesManager,
}: {
  servicesManager: AppTypes.ServicesManager;
}): () => void {
  const { viewportGridService, syncGroupService } = servicesManager.services;

  const unsubscribe = viewportGridService.select(
    selectStability('rendered'),
    ({ isStable, epoch }) => {
      if (!isStable) {
        console.debug(`SyncStabilityPolicy: suspending synchronizers (epoch ${epoch})`);
        syncGroupService.suspendAll();
        return;
      }
      console.debug(`SyncStabilityPolicy: resuming synchronizers (epoch ${epoch})`);
      syncGroupService.resumeAll();
    },
    { equality: shallowEqual }
  );

  return () => {
    unsubscribe();
    // Never leave synchronizers suspended once the policy is uninstalled.
    syncGroupService.resumeAll();
  };
}
