import React from 'react';
import type { IconProps } from '../types';

export const Export = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="Export"
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
      <line
        x1="12"
        y1="13.125"
        x2="12"
        y2="5"
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <polyline
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        points="9.1875 7.8125 12 5 14.8125 7.8125"
      ></polyline>
      <path
        d="M13.875,10.000625 L16.375,10.000625 C16.720178,10.000625 17,10.280447 17,10.625625 L17,18.750625 C17,19.095803 16.720178,19.375625 16.375,19.375625 L7.625,19.375625 C7.27982203,19.375625 7,19.095803 7,18.750625 L7,10.625625 C7,10.280447 7.27982203,10.000625 7.625,10.000625 L10.125,10.000625"
        id="Path"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></path>
    </g>
  </svg>
);

export default Export;
