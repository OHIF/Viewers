import React from 'react';
import type { IconProps } from '../types';

export const TabSegmentation = (props: IconProps) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <circle
        stroke="currentColor"
        cx="11.037"
        cy="10.912"
        r="8"
      />
      <g stroke="currentColor">
        <path
          strokeLinecap="square"
          d="m11.354 3.575-7.779 7.779M17.364 6.757 6.757 17.364"
        />
        <path d="m18.955 9.763-9.192 9.192" />
        <path
          strokeLinecap="square"
          d="M15.066 4.46 4.459 15.065"
        />
      </g>
      <path d="M0 0h22v22H0z" />
    </g>
  </svg>
);

export default TabSegmentation;
