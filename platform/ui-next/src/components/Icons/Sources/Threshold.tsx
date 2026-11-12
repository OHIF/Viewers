import React from 'react';
import type { IconProps } from '../types';

export const Threshold = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M18 17L15 17"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path
      d="M13 17H6"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path
      d="M13 19L13 15"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinecap="round"
    />
    <path
      d="M8.49512 13.0464C8.10547 13.0464 7.8689 12.7959 7.8689 12.3784V7.72119H6.52832C6.21753 7.72119 5.99023 7.49854 5.99023 7.19702C5.99023 6.89087 6.21753 6.66821 6.52832 6.66821H10.4666C10.782 6.66821 11.0046 6.88623 11.0046 7.19702C11.0046 7.50317 10.782 7.72119 10.4666 7.72119H9.12134V12.3784C9.12134 12.7913 8.88013 13.0464 8.49512 13.0464Z"
      fill="currentColor"
    />
  </svg>
);

export default Threshold;
