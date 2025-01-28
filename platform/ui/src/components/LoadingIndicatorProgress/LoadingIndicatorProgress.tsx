import { useServices } from '@ohif/ui';

/**
 *  A React component that renders a loading indicator.
 * if progress is not provided, it will render an infinite loading indicator
 * if progress is provided, it will render a progress bar
 * Optionally a textBlock can be provided to display a message
 */

function LoadingIndicatorProgress({ className, textBlock, progress }) {
  const { services } = useServices();
  const Component = services.customizationService.getCustomization('ui.LoadingIndicatorProgress');
  return Component({
    className,
    textBlock,
    progress,
  });
}
export default LoadingIndicatorProgress;
