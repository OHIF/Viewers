import React from 'react';
import type { IconProps } from '../types';

export const SeriesPlaceholder = (props: IconProps) => (
  <svg
    width="116px"
    height="78px"
    viewBox="0 0 116 78"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      opacity="0.5"
      x="1"
      y="1"
      width="114"
      height="76"
      rx="17"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M47.8334 48.1667H39.5C39.058 48.1667 38.6341 47.9911 38.3215 47.6785C38.009 47.3659 37.8334 46.942 37.8334 46.5V21.5C37.8334 21.058 38.009 20.634 38.3215 20.3215C38.6341 20.0089 39.058 19.8333 39.5 19.8333H64.5C64.9421 19.8333 65.366 20.0089 65.6786 20.3215C65.9911 20.634 66.1667 21.058 66.1667 21.5V29.8333"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M74.5 29.8333H49.5C48.5796 29.8333 47.8334 30.5795 47.8334 31.5V56.5C47.8334 57.4205 48.5796 58.1667 49.5 58.1667H74.5C75.4205 58.1667 76.1667 57.4205 76.1667 56.5V31.5C76.1667 30.5795 75.4205 29.8333 74.5 29.8333Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default SeriesPlaceholder;
