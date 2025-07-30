import React from 'react';
import type { IconProps } from '../types';

export const More = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <title>icon-more</title>
    <g
      id="icon-more"
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
        fill="currentColor"
        cx="6"
        cy="12"
        r="2"
      ></circle>
      <circle
        id="Oval"
        fill="currentColor"
        cx="12"
        cy="12"
        r="2"
      ></circle>
      <circle
        id="Oval"
        fill="currentColor"
        cx="18"
        cy="12"
        r="2"
      ></circle>
    </g>
  </svg>
);

export default More;
