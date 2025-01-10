import React from 'react';
import type { IconProps } from '../types';

export const EyeHidden = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 20"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    >
      <g opacity=".5">
        <path
          d="M17.433 2.556c1.352.98 2.578 2.122 3.65 3.402 0 0-4.719 5.959-10.541 5.959-.933-.006-1.86-.149-2.75-.426M3.637 9.35C2.29 8.373 1.07 7.234 0 5.958 0 5.958 4.719 0 10.542 0c.773.003 1.543.103 2.291.298M6.875 5.958c0-2.025 1.642-3.666 3.667-3.666M14.208 5.958c0 2.025-1.641 3.667-3.666 3.667"
          transform="translate(1 1) translate(.458 3.208)"
        />
      </g>
      <path
        d="M19.938 0.229L2.063 18.104"
        transform="translate(1 1)"
      />
    </g>
  </svg>
);

export default EyeHidden;
