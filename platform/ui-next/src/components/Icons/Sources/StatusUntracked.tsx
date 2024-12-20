import React from 'react';
import type { IconProps } from '../types';

export const StatusUntracked = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <path d="M0 0h24v24H0z" />
      <rect
        stroke="currentColor"
        fill="#0D0E24"
        x=".5"
        y=".5"
        width="23"
        height="23"
        rx="11.5"
      />
    </g>
  </svg>
);

export default StatusUntracked;
