import React from 'react';
import type { IconProps } from '../types';

export const StatusError = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="StatusAlert"
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
        cx="12"
        cy="12"
        r="8"
      ></circle>
      <g
        id="Group"
        transform="translate(11.5, 8)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line
          x1="0.502969489"
          y1="5"
          x2="0.502969489"
          y2="5.55111512e-16"
          id="Path"
        ></line>
        <path
          d="M0.494019489,7.75 C0.427967985,7.75102315 0.365128544,7.77867594 0.319754003,7.82668634 C0.274379462,7.87469675 0.250315262,7.93899595 0.253019489,8.005 C0.257853669,8.14136674 0.369567839,8.24954844 0.506019489,8.25 L0.506019489,8.25 C0.57198073,8.2487037 0.634656968,8.22096694 0.679972815,8.17301863 C0.725288662,8.12507033 0.749445908,8.06092934 0.747019489,7.995 C0.742888429,7.86182395 0.636177529,7.75467571 0.503019489,7.75 L0.498019489,7.75"
          id="Path"
        ></path>
      </g>
    </g>
  </svg>
);

export default StatusError;
