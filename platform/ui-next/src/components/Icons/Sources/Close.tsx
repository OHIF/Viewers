import React from 'react';
import type { IconProps } from '../types';

export const Close = (props: IconProps) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M12 1.05 10.95 0 6 4.95 1.05 0 0 1.05 4.95 6 0 10.95 1.05 12 6 7.05 10.95 12 12 10.95 7.05 6z"
      fill="currentColor"
      fillRule="evenodd"
    />
  </svg>
);

export default Close;
