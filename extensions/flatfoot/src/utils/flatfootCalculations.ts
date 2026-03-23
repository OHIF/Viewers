/**
 * Flatfoot / Foot Arch Clinical Calculations
 */

export interface ArchIndexResult {
  totalLength: number;
  midFootLength: number;
  archIndex: number;
  classification: string;
}

/**
 * Arch Index (Cavanagh & Rodgers method)
 * AI = midFootContactLength / totalFootLength
 * Normal: 0.21–0.26
 */
export function archIndex(
  totalFootLengthPx: number,
  midFootLengthPx: number,
  pxPerMm: number = 1
): ArchIndexResult {
  const ai = midFootLengthPx / totalFootLengthPx;
  let classification = '';
  if (ai < 0.21) classification = 'High Arch (Pes Cavus)';
  else if (ai <= 0.26) classification = 'Normal Arch';
  else classification = 'Flat Foot (Pes Planus)';
  return {
    totalLength: totalFootLengthPx / pxPerMm,
    midFootLength: midFootLengthPx / pxPerMm,
    archIndex: parseFloat(ai.toFixed(3)),
    classification,
  };
}

/**
 * Calcaneal Pitch Angle
 * Angle between calcaneus inferior border and the reference horizontal.
 * Normal: 17–32°
 */
export function calcanealPitchAngle(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p1.y - p2.y; // screen y is inverted
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return Math.round(Math.abs(angle));
}

/**
 * Clarke's Angle (longitudinal arch angle)
 * Measured at the apex of the medial longitudinal arch.
 * @param heel  Most posterior inferior point of foot
 * @param apex  Highest point of medial longitudinal arch
 * @param ball  First metatarsal head
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
  const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}

/**
 * Euclidean pixel distance between two points.
 */
export function pixelDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Meary's Angle (Talo-first metatarsal angle)
 * Angle between talus axis and 1st metatarsal axis on lateral view.
 * Normal: < 4°. > 4° indicates flatfoot.
 */
export function mearysAngle(
  talusAxis: [{ x: number; y: number }, { x: number; y: number }],
  metatarsalAxis: [{ x: number; y: number }, { x: number; y: number }]
): number {
  const v1 = { x: talusAxis[1].x - talusAxis[0].x, y: talusAxis[1].y - talusAxis[0].y };
  const v2 = { x: metatarsalAxis[1].x - metatarsalAxis[0].x, y: metatarsalAxis[1].y - metatarsalAxis[0].y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  return Math.round((Math.acos(cos) * 180) / Math.PI);
}
