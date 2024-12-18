import React from 'react';
import type { IconProps } from '../types';

export const InfoLink = (props: IconProps) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 14 14"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d="M7 .102A6.899 6.899 0 1 0 7 13.9 6.899 6.899 0 0 0 7 .102zm0 .875a6.024 6.024 0 1 1 0 12.048A6.024 6.024 0 0 1 7 .977z" />
      <path d="M6.462 5.486c.503 0 .917.38.97.87l.006.106v3.769a.438.438 0 0 1-.868.078l-.007-.078V6.46a.101.101 0 0 0-.07-.095l-.031-.005H5.385a.437.437 0 0 1-.079-.868l.079-.007h1.077zM6.192 2.793l.089.006a.707.707 0 1 1-.177 0l.088-.006z" />
      <path d="M8.615 9.794c.242 0 .438.224.438.5 0 .246-.155.45-.359.492l-.079.008h-3.23c-.242 0-.438-.224-.438-.5 0-.245.155-.45.359-.492l.079-.008h3.23z" />
    </g>
  </svg>
);

export default InfoLink;
