import React from 'react';
import type { IconProps } from '../types';

export const NotificationInfo = (props: IconProps) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g
      fill="none"
      fillRule="evenodd"
    >
      <circle
        fill="#0944B3"
        cx="12"
        cy="12"
        r="12"
      />
      <g
        stroke="#FFF"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12.538 17.423V11.5a.846.846 0 0 0-.846-.846H10M11.27 6.423a.423.423 0 1 1 0 .846.423.423 0 0 1 0-.846M10 17.425h5.077" />
      </g>
    </g>
  </svg>
);

export default NotificationInfo;
