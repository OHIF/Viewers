import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import throttle from 'lodash.throttle';
import { XNATStudyLoadingListener } from '../../utils/StudyLoadingListener/XNATStudyLoadingListener';

const size = 14;
const strokeWidth = size / 2;
const radius = strokeWidth / 2;
const center = size / 2;
const strokeDasharray = radius * 2 * Math.PI;

const computeProgress = value =>
  strokeDasharray - (value / 100) * strokeDasharray;

const ScanLoadingProgress = props => {
  const {
    displaySetInstanceUID,
    percentComplete: percent,
    loadingStatus,
    setLoadingStatus,
  } = props;
  const [percentComplete, setPercentComplete] = useState(
    computeProgress(percent)
  );

  useEffect(() => {
    const onProgressChange = throttle(({ detail }) => {
      const { progressId, progressData } = detail;
      if (displaySetInstanceUID === progressId) {
        const percent = progressData ? progressData.percentComplete : 0;
        setPercentComplete(computeProgress(percent));
        if (loadingStatus !== progressData.loadingStatus) {
          setLoadingStatus(progressData.loadingStatus);
        }
      }
    }, 100);

    document.addEventListener(
      XNATStudyLoadingListener.events.OnProgress,
      onProgressChange
    );

    return () => {
      document.removeEventListener(
        XNATStudyLoadingListener.events.OnProgress,
        onProgressChange
      );
    };
  }, [setLoadingStatus]);

  return (
    <svg height={size} width={size} className="roiProgressCircle">
      {/*<circle*/}
      {/*  cx="7"*/}
      {/*  cy="7"*/}
      {/*  r="6"*/}
      {/*  strokeWidth="1"*/}
      {/*  fill="none"*/}
      {/*  stroke="var(--ui-gray-light)"*/}
      {/*></circle>*/}
      <circle
        stroke="var(--active-color)"
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

ScanLoadingProgress.protoTypes = {
  displaySetInstanceUID: PropTypes.string.isRequired,
  percentComplete: PropTypes.number.isRequired,
};

export default ScanLoadingProgress;
