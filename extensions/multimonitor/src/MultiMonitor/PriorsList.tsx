import React, { useState, useEffect, useMemo } from 'react';

export default function PriorsList(props) {
  const { studyData } = props;
  if (!studyData) return null;

  return (<div style={{ background: '#7fdf7f', width: '100%' }}>
    <h1>Prior Studies</h1>
  </div>)
}
