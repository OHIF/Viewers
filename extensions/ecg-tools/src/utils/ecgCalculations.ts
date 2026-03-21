/**
 * ECG Clinical Calculations
 * All formulas follow standard clinical cardiology conventions.
 */

export interface EcgCalibration {
  /** pixels per millivolt (vertical) */
  pxPerMv: number;
  /** pixels per millisecond (horizontal) */
  pxPerMs: number;
}

export interface QTcResult {
  qtMs: number;
  rrMs: number;
  qtcMs: number;
  formula: 'Bazett';
}

export interface HRResult {
  rrMs: number;
  bpm: number;
}

export interface QRSAxisResult {
  leadIAmplitudeMv: number;
  leadAVFAmplitudeMv: number;
  axisDegrees: number;
  interpretation: string;
}

export interface ArchIndexResult {
  totalLength: number;
  midFootLength: number;
  archIndex: number;
  classification: string;
}

// ─── ECG Core Formulas ────────────────────────────────────────────────────────

/**
 * Bazett's formula: QTc = QT / sqrt(RR)
 * @param qtMs  QT interval in milliseconds
 * @param rrMs  RR interval in milliseconds
 */
export function bazettQTc(qtMs: number, rrMs: number): QTcResult {
  const qtSec = qtMs / 1000;
  const rrSec = rrMs / 1000;
  const qtcSec = qtSec / Math.sqrt(rrSec);
  return {
    qtMs,
    rrMs,
    qtcMs: Math.round(qtcSec * 1000),
    formula: 'Bazett',
  };
}

/**
 * Heart rate from RR interval.
 * HR (bpm) = 60000 / RR (ms)
 */
export function heartRate(rrMs: number): HRResult {
  return {
    rrMs,
    bpm: Math.round(60000 / rrMs),
  };
}

/**
 * QRS Electrical Axis from Lead I and aVF net amplitudes.
 * Uses the hexaxial reference system.
 * @param leadIAmplitudeMv   Net QRS amplitude in Lead I (mV)
 * @param leadAVFAmplitudeMv Net QRS amplitude in Lead aVF (mV)
 */
export function qrsAxis(leadIAmplitudeMv: number, leadAVFAmplitudeMv: number): QRSAxisResult {
  const axisDegrees = Math.round(
    (Math.atan2(leadAVFAmplitudeMv, leadIAmplitudeMv) * 180) / Math.PI
  );
  let interpretation = '';
  if (axisDegrees >= -30 && axisDegrees <= 90) {
    interpretation = 'Normal Axis';
  } else if (axisDegrees < -30 && axisDegrees >= -90) {
    interpretation = 'Left Axis Deviation';
  } else if (axisDegrees > 90 && axisDegrees <= 180) {
    interpretation = 'Right Axis Deviation';
  } else {
    interpretation = 'Extreme Axis Deviation';
  }
  return { leadIAmplitudeMv, leadAVFAmplitudeMv, axisDegrees, interpretation };
}

/**
 * Convert pixel distance to clinical units using calibration.
 */
export function pxToMs(px: number, cal: EcgCalibration): number {
  return Math.round(px / cal.pxPerMs);
}

export function pxToMv(px: number, cal: EcgCalibration): number {
  return parseFloat((px / cal.pxPerMv).toFixed(3));
}

/** Standard paper speed calibration: 25 mm/s, 1mm = 40ms, 10mm = 1mV */
export function standardCalibration(pixelsPerMm: number): EcgCalibration {
  return {
    pxPerMs: pixelsPerMm / 40,   // 1mm = 40ms at 25mm/s
    pxPerMv: pixelsPerMm * 10,   // 10mm = 1mV
  };
}

/**
 * RR Interval variance — compares multiple RR intervals.
 * Returns std deviation in ms.
 */
export function rrVariance(rrIntervals: number[]): { mean: number; stdDev: number; variance: number } {
  if (rrIntervals.length < 2) return { mean: rrIntervals[0] ?? 0, stdDev: 0, variance: 0 };
  const mean = rrIntervals.reduce((a, b) => a + b, 0) / rrIntervals.length;
  const variance = rrIntervals.reduce((sum, rr) => sum + Math.pow(rr - mean, 2), 0) / rrIntervals.length;
  return { mean: Math.round(mean), stdDev: Math.round(Math.sqrt(variance)), variance: Math.round(variance) };
}

// ─── Flatfoot / Arch Calculations ────────────────────────────────────────────

/**
 * Arch Index = midfoot contact area / total contact area (Cavanagh & Rodgers)
 * Simplified: AI = middleThird / (total - toes)
 */
export function archIndex(
  totalFootLengthPx: number,
  midFootLengthPx: number,
  scale: number = 1 // px per mm
): ArchIndexResult {
  const ai = midFootLengthPx / totalFootLengthPx;
  let classification = '';
  if (ai < 0.21) classification = 'High Arch (Pes Cavus)';
  else if (ai <= 0.26) classification = 'Normal Arch';
  else classification = 'Flat Foot (Pes Planus)';
  return {
    totalLength: totalFootLengthPx / scale,
    midFootLength: midFootLengthPx / scale,
    archIndex: parseFloat(ai.toFixed(3)),
    classification,
  };
}

/**
 * Calcaneal Pitch Angle — angle between calcaneus and floor reference.
 * @param p1 Posterior inferior calcaneus
 * @param p2 Anterior inferior calcaneus (plantar fascia origin)
 */
export function calcanealPitchAngle(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p2.x - p1.x;
  const dy = p1.y - p2.y; // y is inverted in screen coords
  const angleRad = Math.atan2(dy, dx);
  return Math.round((angleRad * 180) / Math.PI);
}

/**
 * Longitudinal arch angle (Clarke's angle).
 * @param heel   Most posterior inferior point
 * @param apex   Highest point of medial arch
 * @param ball   First metatarsal head
 */
export function clarkeAngle(
  heel: { x: number; y: number },
  apex: { x: number; y: number },
  ball: { x: number; y: number }
): number {
  const v1 = { x: heel.x - apex.x, y: heel.y - apex.y };
  const v2 = { x: ball.x - apex.x, y: ball.y - apex.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cosAngle = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  return Math.round((Math.acos(cosAngle) * 180) / Math.PI);
}

/**
 * Euclidean pixel distance between two points.
 */
export function pixelDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
