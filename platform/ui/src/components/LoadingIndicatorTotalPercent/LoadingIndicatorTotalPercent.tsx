import CustomizableRenderComponent from '../../utils/CustomizableRenderComponent';

export interface LoadingIndicatorTotalPercentProps {
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
  loadingText,
  targetText,
}: LoadingIndicatorTotalPercentProps) {
  return CustomizableRenderComponent({
    customizationId: 'ui.LoadingIndicatorTotalPercent',
    className,
    totalNumbers,
    percentComplete,
    loadingText,
    targetText,
  });
}

export default LoadingIndicatorTotalPercent;
