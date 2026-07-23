import React from 'react';
import type { IconProps } from '../types';

export const Play = (props: IconProps) => (
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
      <path
        d="M6 6.597a.597.597 0 0 1 .864-.534l11.806 5.903a.597.597 0 0 1 0 1.068L6.864 18.937A.597.597 0 0 1 6 18.403V6.597z"
        fill="currentColor"
      />
    </g>
  </svg>
);

export default Play;
