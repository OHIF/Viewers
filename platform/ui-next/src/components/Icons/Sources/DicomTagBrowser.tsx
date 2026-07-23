import React from 'react';
import type { IconProps } from '../types';

export const DicomTagBrowser = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 28 28"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      id="tool-dicom-tag-browser"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <rect
        id="Rectangle"
        x="0"
        y="0"
        width="28"
        height="28"
      ></rect>
      <g
        id="Group"
        transform="translate(4, 5.5)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <circle
          id="Oval"
          cx="1.73913043"
          cy="1.73913043"
          r="1.73913043"
        ></circle>
        <line
          x1="6.95652174"
          y1="1.73913043"
          x2="20"
          y2="1.73913043"
          id="Path"
        ></line>
        <circle
          id="Oval"
          cx="1.73913043"
          cy="8.69565217"
          r="1.73913043"
        ></circle>
        <line
          x1="6.95652174"
          y1="8.69565217"
          x2="20"
          y2="8.69565217"
          id="Path"
        ></line>
        <circle
          id="Oval"
          cx="1.73913043"
          cy="15.6521739"
          r="1.73913043"
        ></circle>
        <line
          x1="6.95652174"
          y1="15.6521739"
          x2="20"
          y2="15.6521739"
          id="Path"
        ></line>
      </g>
    </g>
  </svg>
);

export default DicomTagBrowser;
