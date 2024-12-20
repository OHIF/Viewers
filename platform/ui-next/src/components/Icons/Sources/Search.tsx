import React from 'react';
import type { IconProps } from '../types';

export const Search = (props: IconProps) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 18 18"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <path d="M0 0h18v18H0z" />
      <g
        transform="translate(1 1)"
        stroke="#348CFD"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <circle
          cx="5.565"
          cy="5.565"
          r="5.565"
        />
        <path d="M9.5 9.5 16 16" />
      </g>
    </g>
  </svg>
);

export default Search;
