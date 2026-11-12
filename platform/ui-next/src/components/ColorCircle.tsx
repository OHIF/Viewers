import React from 'react';

export function ColorCircle({ colorHex, className = 'inline-flex' }) {
  return (
    <div className={`h-5 w-5 ${className} items-center justify-center`}>
      <span
        className="ml-2 h-2 w-2 rounded-full"
        style={{ backgroundColor: colorHex, marginLeft: 0 }}
      />
    </div>
  );
}
