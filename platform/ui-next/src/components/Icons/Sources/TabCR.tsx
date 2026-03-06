import React from 'react';
import type { IconProps } from '../types';

/** Icon for CR (Compte-Rendu) - document / report */
export const TabCR = (props: IconProps) => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 22 22"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g fill="none" fillRule="evenodd" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2h8l4 4v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" strokeWidth="1.5" />
      <path d="M14 2v4h4" strokeWidth="1.5" />
      <path d="M7 10h8M7 14h6" strokeWidth="1.2" />
    </g>
  </svg>
);

export default TabCR;
