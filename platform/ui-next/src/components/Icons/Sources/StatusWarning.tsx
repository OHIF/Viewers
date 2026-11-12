import React from 'react';
import type { IconProps } from '../types';

export const StatusWarning = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      id="status-warning"
      stroke="none"
      strokeWidth="1"
      fill="none"
      fillRule="evenodd"
    >
      <g>
        <rect
          id="Rectangle"
          x="0"
          y="0"
          width="24"
          height="24"
        ></rect>
        <g
          id="Group-5"
          transform="translate(4, 4)"
          stroke="#FFD22A"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M8.0001715,11.3365862 C8.1842651,11.3365862 8.33350959,11.4858235 8.33350959,11.6699171 C8.33350959,11.8540107 8.1842651,12.0032552 8.0001715,12.0032552 C7.8160779,12.0032552 7.66684054,11.8540107 7.66684054,11.6699171 C7.66684054,11.4858235 7.8160779,11.3365862 8.0001715,11.3365862"
            id="Path"
          ></path>
          <line
            x1="8.0001715"
            y1="8.67127184"
            x2="8.0001715"
            y2="4.67130038"
            id="Path"
          ></line>
          <path
            d="M9.11749686,0.669995592 C8.89725509,0.25756493 8.46772416,0 8.0001715,0 C7.53261884,0 7.10308791,0.25756493 6.88284614,0.669995592 L0.141560901,13.5152373 C-0.0609866009,13.9006851 -0.0452769444,14.3643734 0.18289394,14.7352286 C0.413865574,15.107289 0.820963502,15.3332864 1.25888626,15.3325594 L14.7414567,15.3325594 C15.1793795,15.3332864 15.5864774,15.107289 15.8174491,14.7352286 C16.0456199,14.3643734 16.0613296,13.9006851 15.8587821,13.5152373 L9.11749686,0.669995592 Z"
            id="Path"
            fillOpacity="0.2"
            fill="#FFD22A"
          ></path>
        </g>
      </g>
    </g>
  </svg>
);

export default StatusWarning;
