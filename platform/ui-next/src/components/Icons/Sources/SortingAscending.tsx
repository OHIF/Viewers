import React from 'react';
import type { IconProps } from '../types';

export const SortingAscending = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="9"
    height="16"
    viewBox="0 0 9 16"
    {...props}
  >
    <g
      fill="currentColor"
      fillRule="evenodd"
    >
      <path
        fill="transparent"
        d="M8.69 11.516L7.51 10.274 4.5 13.442 1.49 10.274 0.31 11.516 4.5 15.926z"
      />
      <path
        d="M8.69 1.516L7.51 0.274 4.499 3.442 1.49 0.274 0.31 1.516 4.5 5.926z"
        transform="matrix(1 0 0 -1 0 6.2)"
      />
    </g>
  </svg>
);

export default SortingAscending;
