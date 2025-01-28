import CustomizableRenderComponent from '../../utils/CustomizableRenderComponent';

/**
 *  A React component that renders a loading indicator.
 * if progress is not provided, it will render an infinite loading indicator
 * if progress is provided, it will render a progress bar
 * Optionally a textBlock can be provided to display a message
 */

function LoadingIndicatorProgress({ className, textBlock, progress }) {
  return CustomizableRenderComponent({
    customizationId: 'ui.LoadingIndicatorProgress',
    className,
    textBlock,
    progress,
  });
}
export default LoadingIndicatorProgress;
