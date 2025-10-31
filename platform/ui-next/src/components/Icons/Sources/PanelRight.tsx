import React from 'react';
import type { IconProps } from '../types';

export const PanelRight = (props: IconProps) => (
  <svg
    width="19"
    height="16"
    viewBox="0 0 19 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="-0.5"
      y="0.5"
      width="18"
      height="15"
      rx="1.5"
      transform="matrix(-1 0 0 1 18 0)"
      stroke="#348CFD"
    />
    <path
      d="M17 0.5H13.5V15.5H17C17.8284 15.5 18.5 14.8284 18.5 14V2C18.5 1.17157 17.8284 0.5 17 0.5Z"
      stroke="#348CFD"
    />
  </svg>
);

export default PanelRight;
