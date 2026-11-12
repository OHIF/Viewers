import React from 'react';
import type { IconProps } from '../types';

export const Pause = (props: IconProps) => (
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
      <path
        d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"
        fill="currentColor"
        fillRule="nonzero"
      />
      <path d="M0 0h24v24H0z" />
    </g>
  </svg>
);

export default Pause;
