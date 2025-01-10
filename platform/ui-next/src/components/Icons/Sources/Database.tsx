import React from 'react';
import type { IconProps } from '../types';

export const Database = (props: IconProps) => (
  <svg
    width="19"
    height="19"
    viewBox="0 0 19 19"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="matrix(0.84873874,0,0,0.84873874,0.13586772,0.14249413)"
    >
      <ellipse
        cx="11"
        cy="4"
        rx="9"
        ry="3"
      />
      <path d="m 2,4 v 14 a 9,3 0 0 0 18,0 V 4" />
      <path d="m 2,11 a 9,3 0 0 0 18,0" />
    </g>
  </svg>
);

export default Database;
