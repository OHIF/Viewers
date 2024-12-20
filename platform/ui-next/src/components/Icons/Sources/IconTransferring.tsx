import React from 'react';
import type { IconProps } from '../types';

export const IconTransferring = (props: IconProps) => (
  <svg
    width="20"
    height="16"
    viewBox="0 0 20 16"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      stroke="#5ACCE6"
      fill="none"
      fillRule="evenodd"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m1 6.467 2.222 3.31 2.556-3.06M19 9.898l-2.22-3.311-2.558 3.061" />
      <path d="M16.75 6.617a6.876 6.876 0 0 1-5.192 7.758A6.773 6.773 0 0 1 5.234 12.6M3.226 9.758a7.06 7.06 0 0 1 5.213-8.575 6.773 6.773 0 0 1 6.638 2.107" />
    </g>
  </svg>
);

export default IconTransferring;
