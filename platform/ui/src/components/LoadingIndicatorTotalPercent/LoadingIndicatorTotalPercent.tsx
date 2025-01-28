import { useServices } from '../../contextProviders';

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
  loadingText,
  targetText,
}: Props) {
  const { services } = useServices();
  const Component = services.customizationService.getCustomization(
    'ui.LoadingIndicatorTotalPercent'
  );
  return Component({
    className,
    totalNumbers,
    percentComplete,
    loadingText,
    targetText,
  });
}

export default LoadingIndicatorTotalPercent;
