import React from 'react';
import type { IconProps } from '../types';

export const StatusTracking = (props: IconProps) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <path d="M0 0h16v16H0z" />
      <rect
        stroke="#5ACCE6"
        fill="#5ACCE6"
        x=".5"
        y=".5"
        width="15"
        height="15"
        rx="7.5"
      />
      <path
        d="m11.389 5-3.615 5.595a.91.91 0 0 1-.68.43.866.866 0 0 1-.727-.313L4.5 8.545"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

export default StatusTracking;
