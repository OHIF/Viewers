import React from 'react';
import type { IconProps } from '../types';

export const GenerateReport = (props: IconProps) => (
  <svg
    width="28px"
    height="28px"
    viewBox="0 0 28 28"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <title>icon-generate-report</title>
    <g
      id="Production"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <g
        id="Artboard"
        transform="translate(-104, -235)"
      >
        <g
          id="icon-generate-report"
          transform="translate(104, 235)"
        >
          {/* Document icon */}
          <rect
            id="Document"
            x="6"
            y="4"
            width="16"
            height="20"
            rx="1"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          ></rect>

          {/* Document lines */}
          <line
            x1="9"
            y1="8"
            x2="19"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          ></line>
          <line
            x1="9"
            y1="11"
            x2="19"
            y2="11"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          ></line>
          <line
            x1="9"
            y1="14"
            x2="19"
            y2="14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          ></line>
          <line
            x1="9"
            y1="17"
            x2="15"
            y2="17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          ></line>

          {/* Plus sign for generation */}
          <circle
            id="Plus Circle"
            cx="20"
            cy="8"
            r="3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          ></circle>
          <line
            x1="20"
            y1="6.5"
            x2="20"
            y2="9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          ></line>
          <line
            x1="18.5"
            y1="8"
            x2="21.5"
            y2="8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          ></line>
        </g>
      </g>
    </g>
  </svg>
);

export default GenerateReport;
