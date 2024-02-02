import React, { useState, useEffect, useMemo } from 'react';

export default function PriorsList(props) {
  const { studyData } = props;
  if (!studyData) return null;

  return (
    <div
      className='first:border-0 border-t border-secondary-light cursor-pointer select-none outline-none text-white ohif-scrollbar'
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <div className="flex flex-1 flex-col px-4 pb-2 bg-secondary-dark">
        <h1>Prior Studies</h1>
      </div>
  </div>)
}
