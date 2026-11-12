import React from 'react';
import type { IconProps } from '../types';

export const Rename = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    {...props}
  >
    <g
      id="Rename"
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
        id="rename"
        transform="translate(4.5, 5)"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon
          id="Rectangle"
          transform="translate(7.6682, 7.2953) rotate(45) translate(-7.6682, -7.2953)"
          points="5.71337096 0.360798742 9.62306412 0.360798742 9.62306412 14.2297836 5.71337096 14.2297836"
        ></polygon>
        <polygon
          id="Path"
          points="1.38207653 10.8162548 0 14.963136 4.14688121 13.5810595"
        ></polygon>
        <path
          d="M13.9536949,3.77359418 L11.1895418,1.00944111 L11.650234,0.548748934 C12.4172745,-0.192083594 13.6365239,-0.181488647 14.3905743,0.57256175 C15.1446246,1.32661215 15.1552196,2.54586147 14.4143871,3.312902 L13.9536949,3.77359418 Z"
          id="Path"
        ></path>
      </g>
    </g>
  </svg>
);

export default Rename;
