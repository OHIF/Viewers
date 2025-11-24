import React from 'react';

const ToothIcon = props => (
  <svg
    width={props.width || 32}
    height={props.height || 32}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M16 2C10 2 6 7 6 12c0 4 2 7 2 12 0 3 2 4 3 4s2-2 3-6c1 4 2 6 3 6s3-1 3-4c0-5 2-8 2-12 0-5-4-10-10-10z"
      stroke="#1976d2"
      strokeWidth="2"
      fill="#fff"
    />
    <path
      d="M12 12c0-2 2-4 4-4s4 2 4 4"
      stroke="#1976d2"
      strokeWidth="1.5"
      fill="none"
    />
  </svg>
);

export default ToothIcon;
