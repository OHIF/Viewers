import React from 'react';
import type { IconProps } from '../types';

const Magnifier = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="111"
    height="111"
    viewBox="0 0 111 111"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
      stroke="#3A3F99"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
      transform="translate(2 2)"
    >
      <circle
        cx="53.419"
        cy="53.419"
        r="53.419"
        fill="#06081D"
      />
      <circle
        cx="49.411"
        cy="49.411"
        r="23.862"
      />
      <path d="M66.282 66.282L81.29 81.29" />
    </g>
  </svg>
);

export default Magnifier;
