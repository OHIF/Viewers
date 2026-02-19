import React from 'react';
import type { IconProps } from '../types';

export const Conferencing = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      id="icon-conferencing"
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
      <g id="Group" transform="translate(2.000000, 2.000000)">
        <path
          d="M20,8 L20,18 C20,19.1045695 19.1045695,20 18,20 L2,20 C0.8954305,20 0,19.1045695 0,18 L0,6 C0,4.8954305 0.8954305,4 2,4 L12,4"
          id="Path"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        ></path>
        <path
          d="M20,8 L16,8 L12,4 L12,8 L20,8 Z"
          id="Path"
          fill="currentColor"
          fillRule="nonzero"
        ></path>
        <circle
          id="Oval"
          fill="currentColor"
          cx="6"
          cy="12"
          r="1.5"
        ></circle>
        <circle
          id="Oval"
          fill="currentColor"
          cx="10"
          cy="12"
          r="1.5"
        ></circle>
        <circle
          id="Oval"
          fill="currentColor"
          cx="14"
          cy="12"
          r="1.5"
        ></circle>
      </g>
    </g>
  </svg>
);

export default Conferencing;
