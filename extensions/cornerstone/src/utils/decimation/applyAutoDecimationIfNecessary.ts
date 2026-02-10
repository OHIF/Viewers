import { Types } from '@ohif/core';
import { Point3 } from '@cornerstonejs/core/types';
import {
  VOLUME_AUTO_DECIMATION_THRESHOLD,
  AUTO_DECIMATION_VIEWPORT_TYPES,
  DEFAULT_IJK_DECIMATION,
} from './constants';

/**
 * Resolves the viewport type from viewport options.
 */
function resolveViewportType(
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions
): string {
  const candidate = viewportOptions.viewportType as string;

  const type =
    typeof candidate === 'string'
      ? candidate
      : candidate && typeof candidate === 'object' && 'value' in candidate
        ? (candidate as { value?: unknown }).value
        : candidate;

  return type ? String(type).toLowerCase() : '';
}

/**
 * Estimates the voxel count for a display set.
 */
function estimateDisplaySetVoxelCount(displaySet?: Types.DisplaySet): number | undefined {
  if (!displaySet) {
    return;
  }

  const displaySetAny = displaySet as any;

  const instance =
    Array.isArray(displaySet.instances) && displaySet.instances.length > 0
      ? displaySet.instances[0]
      : Array.isArray(displaySetAny.images) && displaySetAny.images.length > 0
        ? displaySetAny.images[0]
        : undefined;

  if (!instance) {
    return;
  }

  const rows = Number(instance.Rows ?? instance.rows);
  const columns = Number(instance.Columns ?? instance.columns);

  let frameCount =
    [
      displaySetAny.numImageFramesOriginal,
      displaySetAny.numImageFrames,
      Array.isArray(displaySetAny.imageIds) ? displaySetAny.imageIds.length : undefined,
      Array.isArray(displaySet.instances) ? displaySet.instances.length : undefined,
      Array.isArray(displaySetAny.images) ? displaySetAny.images.length : undefined,
    ]
      .map(candidate => Number(candidate))
      .find(value => Number.isFinite(value) && value > 0) ?? undefined;

  if ((!frameCount || frameCount <= 0) && displaySetAny.dynamicVolumeInfo?.timePoints?.length) {
    const firstTimePoint = displaySetAny.dynamicVolumeInfo.timePoints[0];
    if (Array.isArray(firstTimePoint)) {
      frameCount = firstTimePoint.length;
    }
  }

  if (!Number.isFinite(rows) || rows <= 0 || !Number.isFinite(columns) || columns <= 0) {
    return;
  }

  if (!Number.isFinite(frameCount) || frameCount <= 0) {
    return;
  }

  return rows * columns * (frameCount as number);
}

/**
 * Calculates the decimation factor from IJK decimation values.
 */
function calculateDecimationFactor([i, j, k]: Point3): number {
  return i * j * k;
}

/**
 * Resolves IJK decimation from viewport options.
 */
function resolveIjkDecimation(
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions
): Point3 | undefined {
  const candidate = viewportOptions.ijkDecimation;

  if (!candidate) {
    return;
  }

  if (Array.isArray(candidate) && candidate.length === 3) {
    return candidate as Point3;
  }

  if (typeof candidate === 'object' && 'value' in candidate) {
    const value = (candidate as { value?: unknown }).value;
    if (Array.isArray(value) && value.length === 3) {
      return value as Point3;
    }
  }

  return;
}

/**
 * Checks if two decimation values are equal.
 */
function decimationEquals(
  left: Point3,
  right: Point3
): boolean {
  return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
}

/**
 * Shows a notification when auto-decimation is applied.
 */
function showAutoDecimationNotification(
  decimation: Point3,
  displaySets: Types.DisplaySet[],
  originalVoxelCount: number,
  servicesManager: AppTypes.ServicesManager
): void {
  const { uiNotificationService, displaySetService } = servicesManager.services;

  if (!uiNotificationService?.show) {
    return;
  }

  const labels =
    displaySetService &&
    displaySets
      .map((displaySet) => {
        if (!displaySet?.displaySetInstanceUID) {
          return null;
        }
        const ds = displaySetService.getDisplaySetByUID(displaySet.displaySetInstanceUID);
        if (!ds) {
          return null;
        }
        return (
          (ds as any).SeriesDescription ||
          (ds as any).description ||
          ds.SeriesInstanceUID ||
          ds.displaySetInstanceUID
        );
      })
      .filter(Boolean)
      .join(', ');

  const messageParts = [
    `Applied ijk decimation ${decimation.join('×')} to keep volume under ${VOLUME_AUTO_DECIMATION_THRESHOLD.toLocaleString()} voxels.`,
  ];

  if (originalVoxelCount > 0) {
    messageParts.push(`Original voxel count: ${originalVoxelCount.toLocaleString()}.`);
  }

  if (labels && labels.length) {
    messageParts.push(`Display sets: ${labels}.`);
  }

  uiNotificationService.show({
    title: 'Volume auto-decimated',
    message: messageParts.join(' '),
    type: 'warning',
  });
}

/**
 * Applies auto-decimation to viewport options if necessary based on display set voxel counts.
 */
export function applyAutoDecimationIfNecessary(
  viewportOptions: AppTypes.ViewportGrid.GridViewportOptions,
  displaySets: Types.DisplaySet[],
  servicesManager: AppTypes.ServicesManager
): AppTypes.ViewportGrid.GridViewportOptions {
  const viewportType = resolveViewportType(viewportOptions);

  if (!AUTO_DECIMATION_VIEWPORT_TYPES.has(viewportType)) {
    return viewportOptions;
  }

  let maxVoxelCount = 0;
  const needsAutoDecimation = displaySets.some((displaySet) => {
    if (!displaySet) {
      return false;
    }

    const voxelCount = estimateDisplaySetVoxelCount(displaySet);

    if (voxelCount === undefined) {
      return false;
    }

    if (voxelCount > maxVoxelCount) {
      maxVoxelCount = voxelCount;
    }

    return voxelCount > VOLUME_AUTO_DECIMATION_THRESHOLD;
  });

  if (!needsAutoDecimation) {
    return viewportOptions;
  }

  const requiredFactor = Math.max(
    1,
    Math.ceil(maxVoxelCount / VOLUME_AUTO_DECIMATION_THRESHOLD)
  );

  const existingDecimation = resolveIjkDecimation(viewportOptions);
  const currentDecimation = existingDecimation ?? DEFAULT_IJK_DECIMATION;
  const normalizedDecimation = currentDecimation.map(value =>
    Number.isFinite(value) && value > 0 ? value : 1
  ) as Point3;

  const currentFactor = calculateDecimationFactor(normalizedDecimation);
  if (requiredFactor <= currentFactor) {
    return viewportOptions;
  }

  const candidateBuilders: Array<() => Point3> = [
    () => [
      normalizedDecimation[0],
      normalizedDecimation[1],
      Math.max(normalizedDecimation[2], 2),
    ],
    () => [
      normalizedDecimation[0],
      normalizedDecimation[1],
      Math.max(normalizedDecimation[2], 3),
    ],
    () => [
      Math.max(normalizedDecimation[0], 2),
      Math.max(normalizedDecimation[1], 2),
      normalizedDecimation[2],
    ],
    () => [
      Math.max(normalizedDecimation[0], 2),
      Math.max(normalizedDecimation[1], 2),
      Math.max(normalizedDecimation[2], 2),
    ],
  ];

  let chosenDecimation: Point3 | undefined;
  for (const buildCandidate of candidateBuilders) {
    const candidate = buildCandidate();
    const candidateFactor = calculateDecimationFactor(candidate);
    if (candidateFactor >= requiredFactor) {
      chosenDecimation = candidate;
      break;
    }
  }

  if (!chosenDecimation) {
    chosenDecimation = candidateBuilders[candidateBuilders.length - 1]();
    while (calculateDecimationFactor(chosenDecimation) < requiredFactor) {
      chosenDecimation = [
        chosenDecimation[0],
        chosenDecimation[1],
        chosenDecimation[2] + 1,
      ];
    }
  }

  if (existingDecimation && decimationEquals(existingDecimation, chosenDecimation)) {
    return viewportOptions;
  }

  showAutoDecimationNotification(chosenDecimation, displaySets, maxVoxelCount, servicesManager);

  return {
    ...viewportOptions,
    ijkDecimation: chosenDecimation,
  };
}
