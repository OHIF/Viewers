import React from 'react';
import type { IconProps } from '../types';

export const ListGrid = ({ className }: IconProps) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M0 6V0H6V6H0ZM0 14V8H6V14H0ZM8 6V0H14V6H8ZM8 14V8H14V14H8ZM1.5 4.5H4.5V1.5H1.5V4.5ZM9.5 4.5H12.5V1.5H9.5V4.5ZM9.5 12.5H12.5V9.5H9.5V12.5ZM1.5 12.5H4.5V9.5H1.5V12.5Z"
      fill="white"
    />
  </svg>
);

export default ListGrid;
