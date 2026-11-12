import React from 'react';
import type { IconProps } from '../types';

export const Hide = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="hide"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <rect
        id="Rectangle"
        x="0"
        y="0"
        width="24"
        height="24"
      ></rect>
      <circle
        id="Oval"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        cx="12.4986195"
        cy="11.8041442"
        r="2.58684689"
      ></circle>
      <path
        d="M20.906611,11.5617197 C20.0470387,10.5861089 16.6094888,7 12.4986195,7 C8.38775024,7 4.95020027,10.5861089 4.090628,11.5617197 C3.96979067,11.7007491 3.96979067,11.9075393 4.090628,12.0465687 C4.95020027,13.0221796 8.38775024,16.6082885 12.4986195,16.6082885 C16.6094888,16.6082885 20.0470387,13.0221796 20.906611,12.0465687 C21.0274483,11.9075393 21.0274483,11.7007491 20.906611,11.5617197 Z"
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </g>
  </svg>
);

export default Hide;
