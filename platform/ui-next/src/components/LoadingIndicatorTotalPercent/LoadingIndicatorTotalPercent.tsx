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
  const progress = percentComplete;
  const totalNumbersText = totalNumbers !== null ? `${totalNumbers}` : '';
  const numTargetsLoadedText =
    percentComplete !== null ? Math.floor((percentComplete * totalNumbers) / 100) : '';

  const textBlock =
    !totalNumbers && percentComplete === null ? (
      <div className="text-sm text-white">{loadingText}</div>
    ) : !totalNumbers && percentComplete !== null ? (
      <div className="text-sm text-white">Loaded {percentComplete}%</div>
    ) : (
      <div className="text-sm text-white">
        Loaded {numTargetsLoadedText} of {totalNumbersText} {targetText}
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
