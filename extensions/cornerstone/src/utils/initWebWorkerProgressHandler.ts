import { eventTarget, EVENTS } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

/**
 * Initializes a handler for web worker progress events.
 * Tracks active worker tasks and shows notifications for their progress.
 *
 * @param uiNotificationService - The UI notification service for showing progress notifications
 */
export function initializeWebWorkerProgressHandler(uiNotificationService: any) {
  // Use a single map to track all active worker tasks
  const activeWorkerTasks = new Map();

  // Create a normalized task key that doesn't include the random ID
  // This helps us identify and deduplicate the same type of task
  const getNormalizedTaskKey = (type: string) => {
    return `worker-task-${type.toLowerCase().replace(/\s+/g, '-')}`;
  };

  eventTarget.addEventListener(EVENTS.WEB_WORKER_PROGRESS, ({ detail }) => {
    let normalizedKey: string | undefined;
    let shouldCleanup = false;

    try {
      const { progress, type, id } = detail;

      // Skip notifications for compute statistics
      if (type === cornerstoneTools.Enums.WorkerTypes.COMPUTE_STATISTICS) {
        return;
      }

      normalizedKey = getNormalizedTaskKey(type);

      if (progress === 0) {
        // Check if we're already tracking a task of this type
        if (!activeWorkerTasks.has(normalizedKey)) {
          const progressPromise = new Promise((resolve, reject) => {
            try {
              activeWorkerTasks.set(normalizedKey, {
                resolve,
                reject,
                originalId: id,
                type,
              });
            } catch (error) {
              console.error(`Error setting active worker task for type "${type}":`, error);
              reject(error);
              throw error; // Re-throw to trigger outer catch and cleanup
            }
          });

          try {
            uiNotificationService.show({
              id: normalizedKey, // Use the normalized key as ID for better deduplication
              title: `${type}`,
              message: `Computing...`,
              autoClose: false,
              allowDuplicates: false,
              deduplicationInterval: 60000, // 60 seconds - prevent frequent notifications of same type
              promise: progressPromise,
              promiseMessages: {
                loading: `Computing...`,
                success: `Completed successfully`,
                error: 'Web Worker failed',
              },
            });
          } catch (error) {
            console.error(`Error showing web worker notification for type "${type}":`, error);
            shouldCleanup = true;
            throw error;
          }
        } else {
          // Already tracking this type of task, just let it continue
          console.debug(`Already tracking a "${type}" task, skipping duplicate notification`);
        }
      }
      // Task completed
      else if (progress === 100) {
        // Check if we have this task type in our tracking map
        const taskData = activeWorkerTasks.get(normalizedKey);

        if (taskData) {
          // Resolve the promise to update the notification
          const { resolve } = taskData;
          resolve({ progress, type });

          // Mark for cleanup
          shouldCleanup = true;

          console.debug(`Worker task "${type}" completed successfully`);
        }
      }
    } catch (error) {
      console.error(`Error in web worker progress handler for type "${detail?.type}":`, error);
      shouldCleanup = true;
    } finally {
      // Clean up if needed
      if (shouldCleanup && normalizedKey) {
        try {
          activeWorkerTasks.delete(normalizedKey);
        } catch (cleanupError) {
          console.error(
            `Error cleaning up active worker task for type "${detail?.type}":`,
            cleanupError
          );
        }
      }
    }
  });
}
