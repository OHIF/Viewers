import React from 'react';
import type { IconProps } from '../types';

export const Download = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      id="icon-download"
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
        rx="4"
      ></rect>
      <circle
        id="Oval"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        cx="12"
        cy="12"
        r="9"
      ></circle>
      <line
        x1="12"
        y1="7.5"
        x2="12"
        y2="16.5"
        id="Path"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <line
        x1="12"
        y1="16.5"
        x2="8.625"
        y2="13.125"
        id="Path"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
      <line
        x1="12"
        y1="16.5"
        x2="15.375"
        y2="13.125"
        id="Path"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      ></line>
    </g>
  </svg>
);

export default Download;
