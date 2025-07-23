import React from 'react';
import type { IconProps } from '../types';

export const EyeVisible = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 13"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      transform="translate(0 1)"
    >
      <circle
        cx="10"
        cy="5.833"
        r="2.917"
      />
      <path d="M19.48 5.56C18.51 4.46 14.635.417 10 .417 5.365.417 1.49 4.46.52 5.56c-.136.157-.136.39 0 .547.97 1.1 4.845 5.143 9.48 5.143 4.635 0 8.51-4.043 9.48-5.143.136-.157.136-.39 0-.547z" />
    </g>
  </svg>
);

export default EyeVisible;
