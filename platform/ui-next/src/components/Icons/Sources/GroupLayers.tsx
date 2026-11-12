import React from 'react';
import type { IconProps } from '../types';

export const GroupLayers = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="25"
    height="25"
    viewBox="0 0 25 25"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      transform="translate(1 1)"
    >
      <path d="M6 17H1c-.552 0-1-.448-1-1V1c0-.552.448-1 1-1h15c.552 0 1 .448 1 1v5" />
      <rect
        width="17"
        height="17"
        x="6"
        y="6"
        rx="1"
      />
    </g>
  </svg>
);

export default GroupLayers;
