import React from 'react';
import type { IconProps } from '../types';

/**
 * VWR-BRAND-01 (2026-07): replaces the stock OHIF quad-square loading glyph
 * (LoadingOHIFMark) with the canonical BlackVoxel tesseract mark — same
 * cube-in-cube geometry as the header wordmark (public/blackvoxel-logo.svg).
 * The inner cube gently breathes via `.tesseract-loading-pulse` (see
 * App.css); prefers-reduced-motion freezes it on a single static frame.
 */
export const TesseractLoadingMark = (props: IconProps) => (
  <svg
    width="47"
    height="47"
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <polygon
      points="32,9 51.9,20.5 51.9,43.5 32,55 12.1,43.5 12.1,20.5"
      fill="#131318"
      stroke="#b9b9c4"
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <g stroke="#5d5da0" strokeWidth="2" strokeLinecap="round">
      <line x1="32" y1="9" x2="32" y2="21.5" />
      <line x1="51.9" y1="20.5" x2="41.1" y2="26.75" />
      <line x1="51.9" y1="43.5" x2="41.1" y2="37.25" />
      <line x1="32" y1="55" x2="32" y2="42.5" />
      <line x1="12.1" y1="43.5" x2="22.9" y2="37.25" />
      <line x1="12.1" y1="20.5" x2="22.9" y2="26.75" />
    </g>
    <polygon
      className="tesseract-loading-pulse"
      points="32,21.5 41.1,26.75 41.1,37.25 32,42.5 22.9,37.25 22.9,26.75"
      fill="#1c1c3a"
      stroke="#8585ff"
      strokeWidth="3"
      strokeLinejoin="round"
      style={{ transformOrigin: '32px 32px' }}
    />
  </svg>
);

export default TesseractLoadingMark;
