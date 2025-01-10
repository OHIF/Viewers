import React from 'react';
import type { IconProps } from '../types';

export const LoadingSpinner = (props: IconProps) => (
  <svg
    role="status"
    aria-label="Loading"
    className={`h-5 w-5 animate-spin ${props.className}`}
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="LoadingSpinner"
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
      <g
        id="Group"
        transform="translate(1, 1)"
        fillRule="nonzero"
      >
        <path
          d="M11,0 C17.0751322,0 22,4.92486775 22,11 C22,17.0751322 17.0751322,22 11,22 C4.92486775,22 0,17.0751322 0,11 C0,4.92486775 4.92486775,0 11,0 Z M11,2 C6.02943725,2 2,6.02943725 2,11 C2,15.9705627 6.02943725,20 11,20 C15.9705627,20 20,15.9705627 20,11 C20,6.02943725 15.9705627,2 11,2 Z"
          id="Oval"
          fill="#348CFD"
          opacity="0.25"
        ></path>
        <path
          d="M19.0287175,4.94590384 C19.5005019,4.65878387 20.1157155,4.80848402 20.4028355,5.28026847 C21.4419642,6.98772474 22,8.94986784 22,10.9915479 C22,17.0666801 17.0751322,21.9915479 11,21.9915479 C10.4477153,21.9915479 10,21.5438326 10,20.9915479 C10,20.4392631 10.4477153,19.9915479 11,19.9915479 C15.9705627,19.9915479 20,15.9621106 20,10.9915479 C20,9.31924154 19.5441371,7.7163545 18.6943528,6.32002184 C18.4072329,5.84823739 18.556933,5.2330238 19.0287175,4.94590384 Z"
          id="Oval"
          fill="#5ACCE6"
        ></path>
      </g>
    </g>
  </svg>
);

export default LoadingSpinner;
