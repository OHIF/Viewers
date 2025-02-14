import React, { useState, useEffect } from 'react';

const size = 18;
const strokeWidth = size / 2;
const radius = strokeWidth / 2;
const center = size / 2;
const strokeDasharray = radius * 2 * Math.PI;

const computeProgress = value =>
  strokeDasharray - (value / 100) * strokeDasharray;

const ProgressColoredCircle = ({ color, uids, percent }) => {
  const [percentComplete, setPercentComplete] = useState(
    computeProgress(percent)
  );

  useEffect(() => {
    const callback = evt => {
      const data = evt.detail;
      if (data.structUid === uids.structUid && data.roiUid === uids.roiUid) {
        setPercentComplete(computeProgress(data.percent));
        evt.stopPropagation();
      }
    };
    document.addEventListener('xnatcontourextracted', callback);

    return () => {
      document.removeEventListener('xnatcontourextracted', callback);
    };
  }, []);

  return (
    <svg height={size} width={size} style={{ verticalAlign: 'middle' }}>
      <circle
        className="roiProgressCircle"
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        style={{ strokeDashoffset: `${percentComplete}` }}
        r={radius}
        cx={center}
        cy={center}
      />
    </svg>
  );
};

export default ProgressColoredCircle;
