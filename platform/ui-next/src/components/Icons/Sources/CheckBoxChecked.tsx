import React from 'react';
import type { IconProps } from '../types';

export const CheckBoxChecked = (props: IconProps) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <defs>
      <path
        id="3nvolf8jsa"
        d="M4.9 8.45 2.4 5.97l.795-.785L4.9 6.875 8.605 3.2l.795.79z"
      />
    </defs>
    <g
      fill="none"
      fillRule="evenodd"
    >
      <rect
        stroke="#348CFD"
        fill="#348CFD"
        x=".5"
        y=".5"
        width="11"
        height="11"
        rx="3"
      />
      <use
        fill="#000"
        xlinkHref="#3nvolf8jsa"
      />
    </g>
  </svg>
);

export default CheckBoxChecked;
