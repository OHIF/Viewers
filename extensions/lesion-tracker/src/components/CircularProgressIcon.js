import React from 'react';

const CircularProgressIcon = ({ value = 0 }) => {
  const RADIUS = 11;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const progress = value / 100;
  const dashoffset = CIRCUMFERENCE * (1 - progress);
  return (
    <div className="caseProgressContainer">
      <div className="caseProgress">
        <div className="radialProgress">
          <svg
            id="svg"
            width="26"
            height="26"
            viewport="0 0 26 26"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              r={RADIUS}
              cx="13"
              cy="13"
              fill="transparent"
            ></circle>
            <circle
              id="bar"
              r={RADIUS}
              cx="13"
              cy="13"
              fill="transparent"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashoffset}
            ></circle>
          </svg>
          <div className="progressArea">1</div>
        </div>
      </div>
    </div>
  );
};

export default CircularProgressIcon;
