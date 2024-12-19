import React from 'react';
import type { IconProps } from '../types';

export const TabLinear = (props: IconProps) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <rect
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        x="1.5"
        y="16.37"
        width="4.13"
        height="4.13"
        rx="1"
      />
      <rect
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        x="16.37"
        y="1.5"
        width="4.13"
        height="4.13"
        rx="1"
      />
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.388 16.612 16.612 5.388"
      />
      <path d="M0 0h22v22H0z" />
    </g>
  </svg>
);

export default TabLinear;
