/**
 * PanelFlatfoot — Foot Longitudinal Arch Measurement Module
 *
 * Clinical measurements:
 *  - Calcaneal Pitch Angle (normal 17–32°)
 *  - Clarke's Angle (longitudinal arch angle)
 *  - Arch Index (Cavanagh & Rodgers: normal 0.21–0.26)
 *  - Meary's Angle (talo-first metatarsal angle)
 *  - Area Polygon (shoelace formula)
 *  - Distance measurements
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  archIndex,
  calcanealPitchAngle,
  clarkeAngle,
  pixelDistance,
} from '../utils/flatfootCalculations';
import SegmentLabelPanel from '../../../../platform/app/src/components/SegmentLabelPanel';

type MeasureTool =
  | 'AREA_POLYGON'
  | 'DISTANCE'
  | 'CALCANEAL_PITCH'
  | 'CLARKE_ANGLE'
  | 'ARCH_INDEX'
  | 'MEARYS_ANGLE'
  | 'TRIANGLE'
  | 'TRIANGLE_SPLIT';

interface Point {
  x: number;
  y: number;
}

interface Measurement {
  id: string;
  tool: MeasureTool;
  points: Point[];
  label: string;
  value: string;
  color: string;
}

const TOOL_META: Record<MeasureTool, { label: string; color: string; points: number; hint: string }> = {
  AREA_POLYGON:    { label: '⬡ Area',           color: '#facc15', points: -1, hint: 'Click dots on image — connected automatically. Press Finish to calculate enclosed area.' },
  DISTANCE:        { label: 'Distance',          color: '#34d399', points: 2,  hint: 'Click 2 points to measure distance' },
  CALCANEAL_PITCH: { label: 'Calcaneal Pitch',   color: '#f59e0b', points: 2,  hint: '1) Posterior-inferior calcaneus  2) Anterior-inferior calcaneus' },
  CLARKE_ANGLE:    { label: "Clarke's Angle",    color: '#a78bfa', points: 3,  hint: '1) Heel  2) Arch apex  3) 1st metatarsal head' },
  ARCH_INDEX:      { label: 'Arch Index',        color: '#fb923c', points: 2,  hint: '1) Posterior heel  2) Tip of longest toe' },
  MEARYS_ANGLE:    { label: "Meary's Angle",     color: '#f472b6', points: 4,  hint: '1–2) Talus axis  3–4) 1st metatarsal axis' },
  TRIANGLE:        { label: '△ Triangle',        color: '#22d3ee', points: 3,  hint: 'Click 3 corner points — calculates all 3 angles, side midpoints & area' },
  TRIANGLE_SPLIT:  { label: '⊿⊿ Split △',       color: '#f97316', points: 3,  hint: '1) Line start  2) Line end  3) Apex — drops perpendicular, creates 2 triangles with all angles' },
};

const MAX_W = 1000;
const MAX_H = 650;

function uid() {
  return Math.random().toString(36).slice(2);
}

/** Shoelace formula — polygon area in px² */
function shoelaceArea(pts: Point[]): number {
  let area = 0;
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += pts[i].x * pts[j].y;
    area -= pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement): Point {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function drawPolygon(
  ctx: CanvasRenderingContext2D,
  pts: Point[],
  color: string,
  areaLabel: string,
  closed = true
) {
  if (pts.length === 0) return;

  // Filled area
  if (pts.length >= 3 && closed) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = color + '33';
    ctx.fill();
  }

  // Solid connecting lines
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  if (pts.length >= 3 && closed) ctx.closePath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.setLineDash([]);
  ctx.stroke();

  // Dashed preview line back to start (while building)
  if (pts.length >= 2 && !closed) {
    ctx.beginPath();
    ctx.moveTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
    ctx.lineTo(pts[0].x, pts[0].y);
    ctx.strokeStyle = color + '66';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Numbered dots
  pts.forEach((pt, i) => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(String(i + 1), pt.x, pt.y);
    ctx.textBaseline = 'alphabetic';
  });

  // Area label at centroid
  if (areaLabel && pts.length >= 3) {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(areaLabel).width;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(cx - tw / 2 - 4, cy - 14, tw + 8, 18);
    ctx.fillStyle = color;
    ctx.fillText(areaLabel, cx, cy);
  }
}

export default function PanelFlatfoot() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [image, setImage]                 = useState<HTMLImageElement | null>(null);
  const [activeTool, setActiveTool]       = useState<MeasureTool>('AREA_POLYGON');
  const [pendingPoints, setPendingPoints] = useState<Point[]>([]);
  const [polyPoints, setPolyPoints]       = useState<Point[]>([]);
  const [measurements, setMeasurements]   = useState<Measurement[]>([]);
  const [pxPerMm, setPxPerMm]             = useState(3.78);
  const [calMode, setCalMode]             = useState(false);
  const [calKnownMm, setCalKnownMm]       = useState('10');
  const [zoom, setZoom]                   = useState(1);
  const [rightTab, setRightTab]           = useState<'results' | 'segments'>('results');
  const [cursorStyle, setCursorStyle]     = useState('crosshair');

  // drag state — refs avoid stale closures during rapid mousemove
  const dragRef     = useRef<{ measurementId: string; pointIdx: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const HIT_RADIUS  = 12; // canvas px

  // ── Canvas size ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const container = containerRef.current;
    const availW = container ? container.clientWidth  - 8 : MAX_W;
    const availH = container ? container.clientHeight - 8 : MAX_H;
    const fitScale = Math.min(availW / image.width, availH / image.height, 1);
    canvas.width  = Math.round(image.width  * fitScale * zoom);
    canvas.height = Math.round(image.height * fitScale * zoom);
  }, [image, zoom]);

  // ── Redraw ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    } else {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#475569';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Upload foot X-ray image', canvas.width / 2, canvas.height / 2);
    }

    measurements.forEach(m => drawMeasure(ctx, m));

    // Live polygon
    if (polyPoints.length > 0) {
      const liveArea =
        polyPoints.length >= 3
          ? `${(shoelaceArea(polyPoints) / (pxPerMm * pxPerMm)).toFixed(1)} mm²`
          : '';
      drawPolygon(ctx, polyPoints, '#facc15', liveArea, false);
    }

    // Pending points for fixed-point tools
    if (activeTool !== 'AREA_POLYGON' && pendingPoints.length > 0) {
      const color = TOOL_META[activeTool]?.color || '#fff';
      pendingPoints.forEach((pt, i) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}`, pt.x, pt.y - 8);
      });
      if (pendingPoints.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(pendingPoints[0].x, pendingPoints[0].y);
        pendingPoints.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  }, [image, measurements, pendingPoints, polyPoints, activeTool, zoom, pxPerMm]);

  function drawMeasure(ctx: CanvasRenderingContext2D, m: Measurement) {
    const pts = m.points;
    if (pts.length === 0) return;

    if (m.tool === 'AREA_POLYGON') {
      drawPolygon(ctx, pts, m.color, m.value, true);
      return;
    }

    if (m.tool === 'TRIANGLE' && pts.length === 3) {
      const [A, B, C] = pts;
      const ab = Math.sqrt((B.x - A.x) ** 2 + (B.y - A.y) ** 2);
      const bc = Math.sqrt((C.x - B.x) ** 2 + (C.y - B.y) ** 2);
      const ca = Math.sqrt((A.x - C.x) ** 2 + (A.y - C.y) ** 2);
      const clamp = (v: number) => Math.min(1, Math.max(-1, v));
      const aA = Math.round((Math.acos(clamp((ab ** 2 + ca ** 2 - bc ** 2) / (2 * ab * ca))) * 180) / Math.PI);
      const aB = Math.round((Math.acos(clamp((ab ** 2 + bc ** 2 - ca ** 2) / (2 * ab * bc))) * 180) / Math.PI);
      const aC = 180 - aA - aB;
      const areaPx = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
      const areaMm = (areaPx / (pxPerMm * pxPerMm)).toFixed(1);
      const cx = (A.x + B.x + C.x) / 3;
      const cy = (A.y + B.y + C.y) / 3;

      // Filled triangle
      ctx.beginPath();
      ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fillStyle = m.color + '22';
      ctx.fill();

      // Sides
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.stroke();

      // Midpoints on each side
      ([
        { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 },
        { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 },
        { x: (C.x + A.x) / 2, y: (C.y + A.y) / 2 },
      ] as Point[]).forEach(mp => {
        ctx.beginPath();
        ctx.arc(mp.x, mp.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.strokeStyle = m.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Vertex dots + angle labels
      ([
        [A, 1, aA],
        [B, 2, aB],
        [C, 3, aC],
      ] as [Point, number, number][]).forEach(([pt, num, angle]) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = m.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(String(num), pt.x, pt.y);
        ctx.textBaseline = 'alphabetic';

        // Angle label pushed outward from centroid
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        const dist = Math.sqrt(dx ** 2 + dy ** 2) || 1;
        const lx = pt.x + (dx / dist) * 22;
        const ly = pt.y + (dy / dist) * 22;
        const angleStr = `${angle}°`;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(angleStr).width;
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(lx - tw / 2 - 3, ly - 12, tw + 6, 14);
        ctx.fillStyle = m.color;
        ctx.fillText(angleStr, lx, ly);
      });

      // Area at centroid
      const areaStr = `${areaMm} mm²`;
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      const tw = ctx.measureText(areaStr).width;
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(cx - tw / 2 - 4, cy - 14, tw + 8, 18);
      ctx.fillStyle = m.color;
      ctx.fillText(areaStr, cx, cy);
      return;
    }

    if (m.tool === 'TRIANGLE_SPLIT' && (pts.length === 3 || pts.length === 4)) {
      const [A, B, C] = pts;
      // Use stored D (pts[3]) if available, else compute perpendicular foot
      let D: Point;
      if (pts.length === 4) {
        D = pts[3];
      } else {
        const dx = B.x - A.x, dy = B.y - A.y;
        const t = Math.max(0, Math.min(1, ((C.x - A.x) * dx + (C.y - A.y) * dy) / (dx * dx + dy * dy)));
        D = { x: A.x + t * dx, y: A.y + t * dy };
      }

      const clamp = (v: number) => Math.min(1, Math.max(-1, v));
      const triAngles = (P: Point, Q: Point, R: Point) => {
        const pq = Math.sqrt((Q.x-P.x)**2 + (Q.y-P.y)**2);
        const qr = Math.sqrt((R.x-Q.x)**2 + (R.y-Q.y)**2);
        const rp = Math.sqrt((P.x-R.x)**2 + (P.y-R.y)**2);
        const aP = Math.round((Math.acos(clamp((pq**2+rp**2-qr**2)/(2*pq*rp)))*180)/Math.PI);
        const aQ = Math.round((Math.acos(clamp((pq**2+qr**2-rp**2)/(2*pq*qr)))*180)/Math.PI);
        return { aP, aQ, aR: 180 - aP - aQ };
      };
      const t1 = triAngles(A, D, C);
      const t2 = triAngles(D, B, C);

      // Draw helper: filled triangle + sides
      const drawTri = (P: Point, Q: Point, R: Point, col: string) => {
        ctx.beginPath();
        ctx.moveTo(P.x, P.y); ctx.lineTo(Q.x, Q.y); ctx.lineTo(R.x, R.y);
        ctx.closePath();
        ctx.fillStyle = col + '22';
        ctx.fill();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.stroke();
      };

      // Draw helper: angle label near vertex, pushed outward from triangle centroid
      const drawAngleLabel = (pt: Point, cx: number, cy: number, angle: number, col: string) => {
        const ddx = pt.x - cx, ddy = pt.y - cy;
        const dist = Math.sqrt(ddx**2 + ddy**2) || 1;
        const lx = pt.x + (ddx / dist) * 24;
        const ly = pt.y + (ddy / dist) * 24;
        const s = `${angle}°`;
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        const tw = ctx.measureText(s).width;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(lx - tw/2 - 3, ly - 12, tw + 6, 14);
        ctx.fillStyle = col;
        ctx.fillText(s, lx, ly);
      };

      // Draw helper: numbered vertex dot
      const drawDot = (pt: Point, num: string, col: string) => {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.font = 'bold 8px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(num, pt.x, pt.y);
        ctx.textBaseline = 'alphabetic';
      };

      // Two triangle colors: tint the two slightly differently
      const col1 = m.color;       // orange
      const col2 = '#a78bfa';     // purple for second triangle

      drawTri(A, D, C, col1);
      drawTri(D, B, C, col2);

      // Perpendicular height line (dashed)
      ctx.beginPath();
      ctx.moveTo(C.x, C.y);
      ctx.lineTo(D.x, D.y);
      ctx.strokeStyle = '#ffffff88';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Right angle mark at D
      const len = 8;
      const abdx = B.x - A.x, abdy = B.y - A.y;
      const abLen = Math.sqrt(abdx*abdx + abdy*abdy) || 1;
      const bx = abdx / abLen;
      const by = abdy / abLen;
      const hx = -(C.y - D.y) / (Math.sqrt((C.x-D.x)**2+(C.y-D.y)**2) || 1);
      const hy =  (C.x - D.x) / (Math.sqrt((C.x-D.x)**2+(C.y-D.y)**2) || 1);
      ctx.strokeStyle = '#ffffff88';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(D.x + bx * len, D.y + by * len);
      ctx.lineTo(D.x + bx * len + hx * len, D.y + by * len + hy * len);
      ctx.lineTo(D.x + hx * len, D.y + hy * len);
      ctx.stroke();

      // Vertex dots
      drawDot(A, 'A', col1);
      drawDot(B, 'B', col2);
      drawDot(C, 'C', '#fff');
      // D dot (foot)
      ctx.beginPath();
      ctx.arc(D.x, D.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffffcc';
      ctx.fill();
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText('D', D.x, D.y);
      ctx.textBaseline = 'alphabetic';

      // Angle labels — Triangle 1 (A, D, C)
      const cx1 = (A.x + D.x + C.x) / 3, cy1 = (A.y + D.y + C.y) / 3;
      drawAngleLabel(A, cx1, cy1, t1.aP, col1);
      drawAngleLabel(D, cx1, cy1, t1.aQ, col1);
      drawAngleLabel(C, cx1, cy1, t1.aR, col1);

      // Angle labels — Triangle 2 (D, B, C)
      const cx2 = (D.x + B.x + C.x) / 3, cy2 = (D.y + B.y + C.y) / 3;
      drawAngleLabel(D, cx2, cy2, t2.aP, col2);
      drawAngleLabel(B, cx2, cy2, t2.aQ, col2);
      drawAngleLabel(C, cx2, cy2, t2.aR, col2);

      return;
    }

    ctx.strokeStyle = m.color;
    ctx.fillStyle = m.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    pts.slice(1).forEach(pt => ctx.lineTo(pt.x, pt.y));
    ctx.stroke();
    pts.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length - 10;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    const tw = ctx.measureText(m.value).width;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(cx - tw / 2 - 3, cy - 12, tw + 6, 15);
    ctx.fillStyle = m.color;
    ctx.fillText(m.value, cx, cy);
  }

  // ── File load ──
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setMeasurements([]);
        setPendingPoints([]);
        setPolyPoints([]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Finish polygon ──
  const finishPolygon = useCallback(() => {
    if (polyPoints.length < 3) return;
    const areaMm = shoelaceArea(polyPoints) / (pxPerMm * pxPerMm);
    setMeasurements(prev => [
      ...prev,
      { id: uid(), tool: 'AREA_POLYGON', points: polyPoints, label: 'Area', color: '#facc15', value: `${areaMm.toFixed(1)} mm²` },
    ]);
    setPolyPoints([]);
  }, [polyPoints, pxPerMm]);

  // ── Canvas click ──
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return;
      const pt = getCanvasCoords(e, canvas);

      if (activeTool === 'AREA_POLYGON') {
        setPolyPoints(prev => [...prev, pt]);
        return;
      }

      const meta = TOOL_META[activeTool];
      const next = [...pendingPoints, pt];

      if (calMode && next.length === 2) {
        const d = pixelDistance(next[0], next[1]);
        const knownMm = parseFloat(calKnownMm) || 10;
        setPxPerMm(d / knownMm);
        setCalMode(false);
        setPendingPoints([]);
        setMeasurements(prev => [
          ...prev,
          { id: uid(), tool: 'DISTANCE', points: next, label: 'Cal', color: '#f59e0b', value: `${knownMm}mm (${d.toFixed(1)}px)` },
        ]);
        return;
      }

      if (next.length < meta.points) {
        setPendingPoints(next);
        return;
      }

      let value = '';
      let label = meta.label;

      if (activeTool === 'DISTANCE') {
        value = `${(pixelDistance(next[0], next[1]) / pxPerMm).toFixed(1)} mm`;
      } else if (activeTool === 'CALCANEAL_PITCH') {
        const angle = calcanealPitchAngle(next[0], next[1]);
        value = `${angle}° ${angle >= 17 && angle <= 32 ? '(Normal)' : '(Abnormal)'}`;
      } else if (activeTool === 'CLARKE_ANGLE') {
        value = `${clarkeAngle(next[0], next[1], next[2])}°`;
      } else if (activeTool === 'ARCH_INDEX') {
        const totalPx = pixelDistance(next[0], next[1]);
        const result = archIndex(totalPx, totalPx / 3, pxPerMm);
        value = `AI: ${result.archIndex} | ${result.classification}`;
        label = 'Arch Index';
      } else if (activeTool === 'MEARYS_ANGLE') {
        const v1 = { x: next[1].x - next[0].x, y: next[1].y - next[0].y };
        const v2 = { x: next[3].x - next[2].x, y: next[3].y - next[2].y };
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2);
        const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2);
        const angle = Math.round((Math.acos(Math.min(1, dot / (mag1 * mag2))) * 180) / Math.PI);
        value = `${angle}° ${angle > 4 ? '(>4° flatfoot)' : '(Normal)'}`;
      } else if (activeTool === 'TRIANGLE') {
        const [A, B, C] = next;
        const ab = Math.sqrt((B.x - A.x) ** 2 + (B.y - A.y) ** 2);
        const bc = Math.sqrt((C.x - B.x) ** 2 + (C.y - B.y) ** 2);
        const ca = Math.sqrt((A.x - C.x) ** 2 + (A.y - C.y) ** 2);
        const clamp = (v: number) => Math.min(1, Math.max(-1, v));
        const aA = Math.round((Math.acos(clamp((ab ** 2 + ca ** 2 - bc ** 2) / (2 * ab * ca))) * 180) / Math.PI);
        const aB = Math.round((Math.acos(clamp((ab ** 2 + bc ** 2 - ca ** 2) / (2 * ab * bc))) * 180) / Math.PI);
        const aC = 180 - aA - aB;
        const areaPx = Math.abs((B.x - A.x) * (C.y - A.y) - (C.x - A.x) * (B.y - A.y)) / 2;
        const areaMm = (areaPx / (pxPerMm * pxPerMm)).toFixed(1);
        value = `∠1=${aA}°  ∠2=${aB}°  ∠3=${aC}° | ${areaMm} mm²`;
        label = 'Triangle';
      } else if (activeTool === 'TRIANGLE_SPLIT') {
        // A–B = baseline, C = apex; D = foot of perpendicular from C onto AB
        const [A, B, C] = next;
        const clamp = (v: number) => Math.min(1, Math.max(-1, v));
        const triAngles = (P: Point, Q: Point, R: Point) => {
          const pq = Math.sqrt((Q.x-P.x)**2 + (Q.y-P.y)**2);
          const qr = Math.sqrt((R.x-Q.x)**2 + (R.y-Q.y)**2);
          const rp = Math.sqrt((P.x-R.x)**2 + (P.y-R.y)**2);
          const aP = Math.round((Math.acos(clamp((pq**2+rp**2-qr**2)/(2*pq*rp)))*180)/Math.PI);
          const aQ = Math.round((Math.acos(clamp((pq**2+qr**2-rp**2)/(2*pq*qr)))*180)/Math.PI);
          return { aP, aQ, aR: 180 - aP - aQ };
        };
        const dx = B.x - A.x, dy = B.y - A.y;
        const t = Math.max(0, Math.min(1, ((C.x-A.x)*dx + (C.y-A.y)*dy) / (dx*dx + dy*dy)));
        const D: Point = { x: A.x + t*dx, y: A.y + t*dy };
        const t1 = triAngles(A, D, C);
        const t2 = triAngles(D, B, C);
        const a1 = Math.abs((D.x-A.x)*(C.y-A.y) - (C.x-A.x)*(D.y-A.y)) / 2;
        const a2 = Math.abs((B.x-D.x)*(C.y-D.y) - (C.x-D.x)*(B.y-D.y)) / 2;
        const mm = (px: number) => (px / (pxPerMm * pxPerMm)).toFixed(1);
        value = `T1: ∠A=${t1.aP}° ∠D=${t1.aQ}° ∠C=${t1.aR}° (${mm(a1)}mm²) | T2: ∠D=${t2.aP}° ∠B=${t2.aQ}° ∠C=${t2.aR}° (${mm(a2)}mm²)`;
        label = 'Split △';
        // Store D as 4th point so it can be dragged freely
        setMeasurements(prev => [
          ...prev,
          { id: uid(), tool: activeTool, points: [...next, D], label, color: meta.color, value },
        ]);
        setPendingPoints([]);
        return;
      }

      setMeasurements(prev => [
        ...prev,
        { id: uid(), tool: activeTool, points: next, label, color: meta.color, value },
      ]);
      setPendingPoints([]);
    },
    [image, activeTool, pendingPoints, pxPerMm, calMode, calKnownMm]
  );

  // ── Recompute stored value after a point is dragged ──
  function recomputeValue(tool: MeasureTool, pts: Point[]): string {
    const clamp = (v: number) => Math.min(1, Math.max(-1, v));
    if (tool === 'TRIANGLE' && pts.length === 3) {
      const [A, B, C] = pts;
      const ab = Math.sqrt((B.x-A.x)**2+(B.y-A.y)**2);
      const bc = Math.sqrt((C.x-B.x)**2+(C.y-B.y)**2);
      const ca = Math.sqrt((A.x-C.x)**2+(A.y-C.y)**2);
      const aA = Math.round((Math.acos(clamp((ab**2+ca**2-bc**2)/(2*ab*ca)))*180)/Math.PI);
      const aB = Math.round((Math.acos(clamp((ab**2+bc**2-ca**2)/(2*ab*bc)))*180)/Math.PI);
      const aC = 180-aA-aB;
      const areaMm = (Math.abs((B.x-A.x)*(C.y-A.y)-(C.x-A.x)*(B.y-A.y))/2/(pxPerMm*pxPerMm)).toFixed(1);
      return `∠1=${aA}°  ∠2=${aB}°  ∠3=${aC}° | ${areaMm} mm²`;
    }
    if (tool === 'TRIANGLE_SPLIT' && (pts.length === 3 || pts.length === 4)) {
      const [A, B, C] = pts;
      let D: Point;
      if (pts.length === 4) {
        D = pts[3];
      } else {
        const dx = B.x-A.x, dy = B.y-A.y;
        const t = Math.max(0, Math.min(1, ((C.x-A.x)*dx+(C.y-A.y)*dy)/(dx*dx+dy*dy)));
        D = { x: A.x+t*dx, y: A.y+t*dy };
      }
      const triAngles = (P: Point, Q: Point, R: Point) => {
        const pq=Math.sqrt((Q.x-P.x)**2+(Q.y-P.y)**2);
        const qr=Math.sqrt((R.x-Q.x)**2+(R.y-Q.y)**2);
        const rp=Math.sqrt((P.x-R.x)**2+(P.y-R.y)**2);
        const aP=Math.round((Math.acos(clamp((pq**2+rp**2-qr**2)/(2*pq*rp)))*180)/Math.PI);
        const aQ=Math.round((Math.acos(clamp((pq**2+qr**2-rp**2)/(2*pq*qr)))*180)/Math.PI);
        return { aP, aQ, aR: 180-aP-aQ };
      };
      const t1=triAngles(A,D,C), t2=triAngles(D,B,C);
      const a1=Math.abs((D.x-A.x)*(C.y-A.y)-(C.x-A.x)*(D.y-A.y))/2;
      const a2=Math.abs((B.x-D.x)*(C.y-D.y)-(C.x-D.x)*(B.y-D.y))/2;
      const mm=(px:number)=>(px/(pxPerMm*pxPerMm)).toFixed(1);
      return `T1: ∠A=${t1.aP}° ∠D=${t1.aQ}° ∠C=${t1.aR}° (${mm(a1)}mm²) | T2: ∠D=${t2.aP}° ∠B=${t2.aQ}° ∠C=${t2.aR}° (${mm(a2)}mm²)`;
    }
    return '';
  }

  // ── Drag handlers ──
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasCoords(e, canvas);
    hasDraggedRef.current = false;
    for (const m of measurements) {
      for (let i = 0; i < m.points.length; i++) {
        const p = m.points[i];
        if (Math.sqrt((pt.x-p.x)**2+(pt.y-p.y)**2) <= HIT_RADIUS) {
          dragRef.current = { measurementId: m.id, pointIdx: i };
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasCoords(e, canvas);

    if (!dragRef.current) {
      const near = measurements.some(m =>
        m.points.some(p => Math.sqrt((pt.x-p.x)**2+(pt.y-p.y)**2) <= HIT_RADIUS)
      );
      setCursorStyle(near ? 'move' : 'crosshair');
      return;
    }

    hasDraggedRef.current = true;
    const { measurementId, pointIdx } = dragRef.current;
    setMeasurements(prev => prev.map(m => {
      if (m.id !== measurementId) return m;
      const newPoints = m.points.map((p, i) => i === pointIdx ? pt : p);
      const newValue = recomputeValue(m.tool, newPoints) || m.value;
      return { ...m, points: newPoints, value: newValue };
    }));
  };

  const handleMouseUp = () => { dragRef.current = null; };

  const liveAreaMm =
    polyPoints.length >= 3
      ? `${(shoelaceArea(polyPoints) / (pxPerMm * pxPerMm)).toFixed(1)} mm²`
      : null;

  return (
    <div className="flex h-full flex-col bg-gray-950 text-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 bg-gray-900 px-4 py-2">
        <span className="text-sm font-bold text-amber-400">Flatfoot Measurement</span>
        <div className="h-4 w-px bg-gray-700" />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded bg-emerald-700 px-3 py-1 text-xs font-medium hover:bg-emerald-600"
        >
          Upload X-Ray
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />

        <div className="h-4 w-px bg-gray-700" />

        {(Object.keys(TOOL_META) as MeasureTool[]).map(tool => (
          <button
            key={tool}
            onClick={() => {
              setActiveTool(tool);
              setPendingPoints([]);
              if (tool !== 'AREA_POLYGON') setPolyPoints([]);
            }}
            className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
              activeTool === tool
                ? tool === 'AREA_POLYGON'
                  ? 'bg-yellow-400 text-black'
                  : 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {TOOL_META[tool].label}
          </button>
        ))}

        <div className="h-4 w-px bg-gray-700" />

        <button
          onClick={() => {
            setCalMode(!calMode);
            setPendingPoints([]);
          }}
          className={`rounded px-2 py-1 text-xs ${calMode ? 'bg-yellow-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        >
          Calibrate
        </button>
        {calMode && (
          <label className="flex items-center gap-1 text-xs text-yellow-300">
            Known:
            <input
              type="number"
              value={calKnownMm}
              onChange={e => setCalKnownMm(e.target.value)}
              className="w-14 rounded bg-gray-700 px-1 py-0.5 text-white"
            />
            mm
          </label>
        )}

        <label className="ml-auto flex items-center gap-1 text-xs text-gray-300">
          Zoom:
          <input
            type="range"
            min={0.5}
            max={3}
            step={0.1}
            value={zoom}
            onChange={e => setZoom(parseFloat(e.target.value))}
            className="w-20"
          />
          {zoom.toFixed(1)}×
        </label>

        <button
          onClick={() => {
            setMeasurements([]);
            setPendingPoints([]);
            setPolyPoints([]);
          }}
          className="rounded bg-red-800 px-2 py-1 text-xs hover:bg-red-700"
        >
          Clear All
        </button>
      </div>

      {/* Hint / polygon status bar */}
      <div className="flex items-center gap-3 border-b border-gray-800 bg-gray-900/60 px-4 py-1 text-xs">
        <span className="text-gray-400">
          {calMode
            ? `Calibration: click 2 points ${calKnownMm}mm apart`
            : TOOL_META[activeTool].hint}
        </span>

        {activeTool === 'AREA_POLYGON' && polyPoints.length > 0 && (
          <>
            <span className="text-yellow-300">
              {polyPoints.length} dot{polyPoints.length !== 1 ? 's' : ''} placed
              {liveAreaMm && (
                <>
                  {' · Area: '}
                  <strong>{liveAreaMm}</strong>
                </>
              )}
            </span>
            {polyPoints.length >= 3 && (
              <button
                onClick={finishPolygon}
                className="rounded bg-yellow-500 px-3 py-0.5 font-semibold text-black hover:bg-yellow-400"
              >
                ✓ Finish &amp; Save
              </button>
            )}
            <button
              onClick={() => setPolyPoints([])}
              className="text-red-300 hover:text-red-100"
            >
              Cancel
            </button>
          </>
        )}

        {activeTool !== 'AREA_POLYGON' && pendingPoints.length > 0 && (
          <span className="text-blue-300">
            {pendingPoints.length}/{TOOL_META[activeTool].points} points
            <button
              onClick={() => setPendingPoints([])}
              className="ml-3 text-red-300 hover:text-red-100"
            >
              Cancel
            </button>
          </span>
        )}

        <span className="ml-auto text-gray-600">{pxPerMm.toFixed(2)} px/mm</span>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="flex flex-1 items-center justify-center overflow-auto bg-gray-950 p-2"
        >
          {!image ? (
            <div
              className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-900 hover:border-amber-500"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg
                className="mb-3 h-14 w-14 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-400">Upload a foot X-ray (lateral view)</p>
              <p className="mt-1 text-xs text-gray-600">PNG, JPG, BMP supported</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={e => { if (!hasDraggedRef.current) handleCanvasClick(e); }}
              className="rounded border border-gray-700 shadow-xl"
              style={{ maxWidth: '100%', maxHeight: '100%', cursor: cursorStyle }}
            />
          )}
        </div>

        {/* Results panel: tabbed Measurements | Label Map */}
        <div className="flex w-60 flex-col overflow-y-auto border-l border-gray-800 bg-gray-900 text-xs">
          {/* Tab header */}
          <div className="flex border-b border-gray-800">
            <button
              onClick={() => setRightTab('results')}
              className={`flex-1 py-1.5 text-center text-xs font-medium transition-colors ${
                rightTab === 'results' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Measurements
            </button>
            <button
              onClick={() => setRightTab('segments')}
              className={`flex-1 py-1.5 text-center text-xs font-medium transition-colors ${
                rightTab === 'segments' ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Label Map
            </button>
          </div>

          {rightTab === 'results' ? (
            <>
              <div className="flex-1 p-3">
                <div className="mb-2 font-bold uppercase tracking-wide text-gray-300">Measurements</div>
                {measurements.length === 0 && <p className="text-gray-600">No measurements yet.</p>}
                {measurements.map(m => (
                  <div
                    key={m.id}
                    className="mb-1.5 flex items-start justify-between rounded bg-gray-800 px-2 py-1.5"
                  >
                    <div>
                      <span className="font-medium" style={{ color: m.color }}>
                        {m.label}
                      </span>
                      <div className="mt-0.5 text-gray-200">{m.value}</div>
                    </div>
                    <button
                      onClick={() => setMeasurements(prev => prev.filter(x => x.id !== m.id))}
                      className="ml-2 text-gray-600 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-800 p-3 text-gray-600">
                <div className="mb-1 font-bold uppercase tracking-wide">Normal Ranges</div>
                <div>Calcaneal Pitch: 17–32°</div>
                <div>Clarke's Angle: 42°+</div>
                <div>Arch Index: 0.21–0.26</div>
                <div>Meary's Angle: &lt;4°</div>
                <div className="mt-2 text-gray-700">
                  <div>AI &lt; 0.21 → Pes Cavus</div>
                  <div>AI 0.21–0.26 → Normal</div>
                  <div>AI &gt; 0.26 → Pes Planus</div>
                </div>
              </div>
            </>
          ) : (
            <SegmentLabelPanel />
          )}
        </div>
      </div>
    </div>
  );
}
