import React from 'react';

interface IconProps {
  className?: string;
  width?: number;
  height?: number;
  color?: string;
}

const FootIcon: React.FC<IconProps> = ({
  className = '',
  width = 24,
  height = 24,
  color = 'currentColor',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Solid black rectangle */}
      <rect
        x="0"
        y="0"
        width="24"
        height="24"
        fill={color}
      />
    </svg>
  );
};

export default FootIcon;
