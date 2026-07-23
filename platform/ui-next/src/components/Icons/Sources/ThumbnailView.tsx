import React from 'react';
import type { IconProps } from '../types';

export const ThumbnailView = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      id="icon-thumbnail-view"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <rect
        id="Rectangle"
        x="0"
        y="0"
        width="24"
        height="24"
      ></rect>
      <rect
        id="Rectangle"
        fill="currentColor"
        x="6"
        y="6"
        width="5"
        height="5"
        rx="1.5"
      ></rect>
      <rect
        id="Rectangle"
        fill="currentColor"
        x="13"
        y="6"
        width="5"
        height="5"
        rx="1.5"
      ></rect>
      <rect
        id="Rectangle"
        fill="currentColor"
        x="6"
        y="13"
        width="5"
        height="5"
        rx="1.5"
      ></rect>
      <rect
        id="Rectangle"
        fill="currentColor"
        x="13"
        y="13"
        width="5"
        height="5"
        rx="1.5"
      ></rect>
    </g>
  </svg>
);

export default ThumbnailView;
