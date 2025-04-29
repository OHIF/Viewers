import React from 'react';
import type { IconProps } from '../types';

export const AlertOutline = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      stroke="#5ACCE6"
      fill="none"
      fillRule="evenodd"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M24 11.794a12.176 12.176 0 0 1-12 12.204 11.823 11.823 0 0 1-12-11.79A12.176 12.176 0 0 1 12 .003a11.824 11.824 0 0 1 12 11.793z"
        strokeWidth="1.5"
      />
      <g strokeWidth="2">
        <path d="M11.74 18.658a.47.47 0 0 0-.26.075c-.068.05-.105.114-.1.18.007.135.175.244.38.244h0c.099 0 .193-.03.26-.076.07-.048.105-.113.1-.18-.006-.132-.165-.24-.366-.243h-.008M11.754 13V6" />
      </g>
    </g>
  </svg>
);

export default AlertOutline;
