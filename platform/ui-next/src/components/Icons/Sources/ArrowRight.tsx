import React from 'react';
import type { IconProps } from '../types';

export const ArrowLeftBold = (props: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    {...props}
  >
    <g fillRule="evenodd">
      <path
        fill="currentcolor"
        fillRule="nonzero"
        d="M17.207 10.793c.36.36.388.928.083 1.32l-.083.094-5 5c-.39.39-1.024.39-1.414 0-.36-.36-.388-.928-.083-1.32l.083-.094 4.292-4.293-4.292-4.293c-.36-.36-.388-.928-.083-1.32l.083-.094c.36-.36.928-.388 1.32-.083l.094.083 5 5z"
      />
      <path
        fill="currentcolor"
        fillRule="nonzero"
        d="M17.5 11.5c0 .513-.386.936-.883.993l-.117.007H6c-.552 0-1-.448-1-1 0-.513.386-.936.883-.993L6 10.5h10.5c.552 0 1 .448 1 1z"
      />
    </g>
  </svg>
);

export default ArrowLeftBold;
