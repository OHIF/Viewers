import React from 'react';
import type { IconProps } from '../types';

export const LayerForeground = (props: IconProps) => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="10.3999"
      y="9.3999"
      width="12.6001"
      height="12.6001"
      rx="3"
      stroke="currentColor"
      strokeLinecap="round"
    />
    <rect
      x="5.5"
      y="4.5"
      width="11.6001"
      height="11.6001"
      rx="2.5"
      fill="currentColor"
      stroke="currentColor"
    />
  </svg>
);

export default LayerForeground;
