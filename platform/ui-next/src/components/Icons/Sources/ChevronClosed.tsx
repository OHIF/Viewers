import React from 'react';
import type { IconProps } from '../types';

export const ChevronClosed = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      id="icon-chevron-closed"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <rect
        id="Rectangle"
        opacity="0.2"
        transform="translate(12, 12) rotate(90) translate(-12, -12)"
        x="0"
        y="0"
        width="24"
        height="24"
        rx="4"
      ></rect>
      <polyline
        id="Path-2"
        stroke="currentColor"
        transform="translate(12.0902, 12.0451) rotate(90) translate(-12.0902, -12.0451)"
        points="8 10 12.090229 14.090229 16.1804581 10"
      ></polyline>
    </g>
  </svg>
);

export default ChevronClosed;
