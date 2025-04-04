import React from 'react';
import type { IconProps } from '../types';

export const CheckBoxUnchecked = (props: IconProps) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x=".5"
      y=".5"
      width="11"
      height="11"
      rx="3"
      stroke="#348CFD"
      fill="none"
      fillRule="evenodd"
    />
  </svg>
);

export default CheckBoxUnchecked;
