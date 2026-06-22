/**
 * useLengthMeasurements.ts (MIMPS-28)
 *
 * Makes the blackvoxel-ai extension aware of OHIF ruler (Length) measurements
 * WITHOUT touching the Length tool or its registration. We subscribe to the
 * MeasurementService pub-sub (the same events the cornerstone `useMeasurements`
 * hook uses) and project each Length measurement into the wire shape the
 * CXR-35 classify endpoint expects (`MeasuredValue`).
 *
 * Coordinate contract (pinned — see 2026-06-21-measure-report-contract.md):
 *   - Length.ts stores endpoints as WORLD coords. We convert each to image
 *     pixel coords with `worldToImageCoords(imageId, worldPoint)`.
 *   - The backend resizes the analyzed frame to a square 512×512 (a non-aspect-
 *     preserving `resize((512,512))`), so we scale native pixels onto that
 *     frame independently per axis:
 *       x_512 = x_native * (512 / columns)
 *       y_512 = y_native * (512 / rows)
 *   - points_px are emitted as [x=col, y=row] integer pairs, top-left origin.
 *
 * Calibration rule (viewer side):
 *   - PixelSpacing present & real → pixel_spacing = [rowSpacing, colSpacing].
 *   - PixelSpacing absent (PNG / single-frame; OHIF flags usingDefaultValues
 *     and defaults spacing to 1) → pixel_spacing = null. We must NOT send
 *     [1,1] — that would masquerade as calibrated. mm/calibration framing is
 *     decided server-side from this null vs array signal.
 */

import { useEffect, useState } from 'react';
import { metaData, utilities as csUtils } from '@cornerstonejs/core';

import type { MeasuredValue } from '../services/inferenceClient';

/** torchxrayvision seg models analyze a 512×512 frame (seg_inference.INPUT_SIZE). */
const ANALYZED_FRAME = 512;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Read row/column PixelSpacing for an image, applying the calibration rule.
 * Returns `null` when the spacing is absent or defaulted (uncalibrated).
 */
function resolvePixelSpacing(imageId: string): [number, number] | null {
  const plane = metaData.get('imagePlaneModule', imageId);
  if (!isObject(plane)) {
    return null;
  }
  // OHIF/cornerstone sets usingDefaultValues=true and defaults spacing to 1
  // for images without real PixelSpacing (PNG / single-frame). Treat that as
  // uncalibrated rather than a real 1 mm/px scale.
  if (plane.usingDefaultValues === true) {
    return null;
  }
  const rowSpacing = plane.rowPixelSpacing;
  const colSpacing = plane.columnPixelSpacing;
  if (typeof rowSpacing !== 'number' || typeof colSpacing !== 'number') {
    return null;
  }
  if (!Number.isFinite(rowSpacing) || !Number.isFinite(colSpacing)) {
    return null;
  }
  // A spacing that defaulted to exactly 1 on both axes is the cornerstone
  // "no real spacing" signal — do not pass it off as calibrated.
  if (rowSpacing === 1 && colSpacing === 1) {
    return null;
  }
  return [rowSpacing, colSpacing];
}

/** Native image dimensions (rows/cols) for the 512-frame scale factor. */
function resolveDimensions(imageId: string): { rows: number; columns: number } | null {
  const plane = metaData.get('imagePlaneModule', imageId);
  if (!isObject(plane)) {
    return null;
  }
  const rows = plane.rows;
  const columns = plane.columns;
  if (typeof rows !== 'number' || typeof columns !== 'number' || rows <= 0 || columns <= 0) {
    return null;
  }
  return { rows, columns };
}

/**
 * Map one MeasurementService Length measurement to a `MeasuredValue`, or null
 * if it can't be projected (missing imageId, off-frame world points, etc.).
 */
function toMeasuredValue(measurement: Record<string, unknown>): MeasuredValue | null {
  const id = measurement.uid;
  const imageId = measurement.referencedImageId;
  const points = measurement.points;
  if (typeof id !== 'string' || typeof imageId !== 'string' || !Array.isArray(points)) {
    return null;
  }
  if (points.length < 2 || !Array.isArray(points[0]) || !Array.isArray(points[1])) {
    return null;
  }

  const dims = resolveDimensions(imageId);
  if (!dims) {
    return null;
  }
  const scaleX = ANALYZED_FRAME / dims.columns;
  const scaleY = ANALYZED_FRAME / dims.rows;

  const projected: Array<[number, number]> = [];
  const nativePx: Array<[number, number]> = [];
  for (const worldPoint of [points[0], points[1]]) {
    const imgPx = csUtils.worldToImageCoords(imageId, worldPoint as [number, number, number]);
    if (!imgPx) {
      return null;
    }
    // Unscaled native [row, col] — used only for a degenerate-length fallback.
    nativePx.push([imgPx[0], imgPx[1]]);
    // csUtils.worldToImageCoords returns [row, col] = [i, j] (see
    // @cornerstonejs/core worldToImageCoords.js: [rowDistance/rowPixelSpacing,
    // columnDistance/columnPixelSpacing]). Scale each axis onto the 512 frame
    // with its OWN factor: row uses scaleY (512/rows), col uses scaleX
    // (512/columns).
    const row = Math.round(imgPx[0] * scaleY);
    const col = Math.round(imgPx[1] * scaleX);
    // Emit on the wire as [x=col, y=row], top-left origin.
    projected.push([col, row]);
  }

  // length_px on the analyzed frame — recompute from the scaled endpoints so it
  // is consistent with points_px regardless of the tool's native unit/scale.
  const dx = projected[1][0] - projected[0][0];
  const dy = projected[1][1] - projected[0][1];
  const scaledLength = Math.hypot(dx, dy);
  // Fallback only when the scaled hypot is degenerate (0, e.g. both endpoints
  // round to the same 512-frame pixel). Use the UNSCALED native endpoint pixel
  // distance — never the tool's cachedStats `length`, which is in MILLIMETERS
  // when the series is calibrated and would be a wrong-unit value as length_px.
  const nativeDx = nativePx[1][1] - nativePx[0][1];
  const nativeDy = nativePx[1][0] - nativePx[0][0];
  const nativePxDistance = Math.hypot(nativeDx, nativeDy);
  // `|| 0` only when BOTH the scaled and native distances are 0 — i.e. the two
  // world endpoints are identical (a genuinely zero-length ruler), never the
  // mm-valued cachedStats `length`. (MeasuredValue.length_px is non-nullable.)
  const length_px = scaledLength || nativePxDistance || 0;

  return {
    id,
    points_px: [projected[0], projected[1]],
    length_px,
    pixel_spacing: resolvePixelSpacing(imageId),
  };
}

/**
 * Subscribe to the MeasurementService and return the live list of Length
 * measurements for the active series, mapped to `MeasuredValue`.
 *
 * @param servicesManager OHIF servicesManager (typed loosely at the boundary).
 * @param seriesInstanceUID Active series to filter to; when omitted, all
 *        Length measurements are returned.
 */
export function useLengthMeasurements(
  servicesManager?: unknown,
  seriesInstanceUID?: string
): MeasuredValue[] {
  const [measurements, setMeasurements] = useState<MeasuredValue[]>([]);

  useEffect(() => {
    if (!isObject(servicesManager)) {
      setMeasurements([]);
      return;
    }
    const services = servicesManager.services;
    if (!isObject(services)) {
      setMeasurements([]);
      return;
    }
    const measurementService = services.measurementService;
    if (!isObject(measurementService)) {
      setMeasurements([]);
      return;
    }

    const getMeasurements = measurementService.getMeasurements;
    const subscribe = measurementService.subscribe;
    const EVENTS = measurementService.EVENTS;
    if (
      typeof getMeasurements !== 'function' ||
      typeof subscribe !== 'function' ||
      !isObject(EVENTS)
    ) {
      setMeasurements([]);
      return;
    }

    const recompute = (): void => {
      const raw = getMeasurements.call(measurementService) as unknown;
      const list = Array.isArray(raw) ? raw : [];
      const next: MeasuredValue[] = [];
      for (const m of list) {
        if (!isObject(m) || m.toolName !== 'Length') {
          continue;
        }
        if (seriesInstanceUID && m.referenceSeriesUID !== seriesInstanceUID) {
          continue;
        }
        const mapped = toMeasuredValue(m);
        if (mapped) {
          next.push(mapped);
        }
      }
      setMeasurements(next);
    };

    recompute();

    const eventNames = [
      EVENTS.MEASUREMENT_ADDED,
      EVENTS.RAW_MEASUREMENT_ADDED,
      EVENTS.MEASUREMENT_UPDATED,
      EVENTS.MEASUREMENT_REMOVED,
      EVENTS.MEASUREMENTS_CLEARED,
    ].filter((e): e is string => typeof e === 'string');

    const subscriptions = eventNames.map(evt => {
      const sub = subscribe.call(measurementService, evt, recompute);
      return isObject(sub) && typeof sub.unsubscribe === 'function'
        ? (sub.unsubscribe as () => void)
        : () => {};
    });

    return () => {
      subscriptions.forEach(unsub => unsub());
    };
  }, [servicesManager, seriesInstanceUID]);

  return measurements;
}
