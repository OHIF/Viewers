import React from 'react';
import type { IconProps } from '../types';

export const AIChat = (props: IconProps) => (
  <svg
    width="24px"
    height="24px"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {/* Brain - left hemisphere */}
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    {/* Brain - right hemisphere */}
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    {/* Brain - center connection */}
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    {/* Brain details - right top */}
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    {/* Brain details - left top */}
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    {/* Brain details - left middle */}
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    {/* Brain details - right middle */}
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    {/* Brain details - left bottom */}
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    {/* Brain details - right bottom */}
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>
);

export default AIChat;
