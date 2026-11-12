import React from 'react';
import type { IconProps } from '../types';

export const SeriesPlaceholder = (props: IconProps) => (
  <svg
    width="75px"
    height="50px"
    viewBox="0 0 75 50"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      opacity="0.3"
      x="1"
      y="1"
      width="73"
      height="48"
      rx="11"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M30.7059 31H25.1176C24.8212 31 24.537 30.8822 24.3274 30.6726C24.1178 30.4631 24 30.1788 24 29.8824V13.1176C24 12.8212 24.1178 12.537 24.3274 12.3274C24.537 12.1178 24.8212 12 25.1176 12H41.8824C42.1788 12 42.4631 12.1178 42.6726 12.3274C42.8822 12.537 43 12.8212 43 13.1176V18.7059"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M47.9412 19H32.0588C31.4741 19 31 19.4741 31 20.0588V35.9412C31 36.5259 31.4741 37 32.0588 37H47.9412C48.5259 37 49 36.5259 49 35.9412V20.0588C49 19.4741 48.5259 19 47.9412 19Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SeriesPlaceholder;
