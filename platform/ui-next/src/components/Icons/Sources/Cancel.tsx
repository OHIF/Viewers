import React from 'react';
import type { IconProps } from '../types';

export const Cancel = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="19"
    height="19"
    viewBox="0 0 19 19"
    {...props}
  >
    <g
      fill="currentColor"
      fillRule="evenodd"
    >
      <circle
        cx="9.5"
        cy="9.5"
        r="9.5"
        fill="currentColor"
      />
      <g
        stroke="#000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <path
          d="M.188.187L8.813 8.812M8.813.187L.188 8.812"
          transform="translate(5 5)"
        />
      </g>
    </g>
  </svg>
);

export default Cancel;
