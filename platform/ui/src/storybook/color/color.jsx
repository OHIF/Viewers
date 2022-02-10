import React from 'react';

// Create a square box with a given color
export const Color = ({ color }) => {
  return <div className="w-8 h-8" style={{ backgroundColor: color }} />;
};
