import React from 'react';
import type { IconProps } from '../types';

export const JumpToSlice = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    {...props}
  >
    <g
      id="icon-jump-to-slice"
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
      <g
        id="jump-to-slice"
        opacity="0.99"
        transform="translate(2, 6.5)"
        fillRule="nonzero"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line
          x1="20.5"
          y1="0"
          x2="9.5"
          y2="0"
          id="Vector"
        ></line>
        <line
          x1="20.5"
          y1="11"
          x2="9.5"
          y2="11"
          id="Vector"
        ></line>
        <polyline
          id="Vector"
          points="4 8.49798584 6 5.49798584 0 5.49798584"
        ></polyline>
        <line
          x1="4"
          y1="2.49798584"
          x2="6"
          y2="5.49798489"
          id="Vector"
        ></line>
        <path
          d="M10.3461538,3.5 L19.6538462,3.5 C20.121164,3.5 20.5,3.79847623 20.5,4.16666614 L20.5,6.83333323 C20.5,7.20152314 20.121164,7.5 19.6538462,7.5 L10.3461538,7.5 C9.87883596,7.5 9.5,7.20152314 9.5,6.83333323 L9.5,4.16666614 C9.5,3.79847623 9.87883596,3.5 10.3461538,3.5 Z"
          id="Vector"
        ></path>
      </g>
    </g>
  </svg>
);

export default JumpToSlice;
