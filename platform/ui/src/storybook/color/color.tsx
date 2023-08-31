import React from 'react';

// Create a square box with a given color
export const Color = ({ color }) => {
  return (
    <div
      className="h-8 w-8"
      style={{ backgroundColor: color }}
    />
  );
};
