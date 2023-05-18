import React from 'react';

import LoadingIndicatorProgress from '../LoadingIndicatorProgress';

interface Props {
  className?: string;
  totalNumbers: number | null;
  percentComplete: number | null;
  loadingText?: string;
  targetText?: string;
}

/**
 *  A React component that renders a loading indicator but accepts a totalNumbers
 * and percentComplete to display a more detailed message.
 */
function LoadingIndicatorTotalPercent({
  className,
  totalNumbers,
  percentComplete,
  loadingText = 'Loading...',
  targetText = 'segments',
}: Props): JSX.Element {
  percentComplete = percentComplete !== null ? percentComplete : null;

  const progress = percentComplete !== null ? percentComplete : null;
  const totalNumbersText = totalNumbers !== null ? `${totalNumbers}` : '';
  const numTargetsLoadedText =
    percentComplete !== null
      ? Math.floor((percentComplete * totalNumbers) / 100)
      : '';

  const textBlock = !totalNumbers ? (
    <div className="text-white text-sm">{loadingText}</div>
  ) : (
    <div className="text-white text-sm flex items-baseline space-x-1">
      <div>Loaded</div>
      <div>{numTargetsLoadedText}</div>
      <div>of</div>
      <div>{totalNumbersText}</div>
      <div>{targetText}</div>
    </div>
  );

  return (
    <LoadingIndicatorProgress
      className={className}
      progress={progress}
      textBlock={textBlock}
    />
  );
}

export default LoadingIndicatorTotalPercent;
