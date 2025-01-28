import CustomizableRenderComponent from '../../utils/CustomizableRenderComponent';

export type ProgressLoadingBarProps = {
  progress?: number;
};
/**
 * A React component that renders a loading progress bar.
 * If progress is not provided, it will render an infinite loading bar
 * If progress is provided, it will render a progress bar
 * The progress text can be optionally displayed to the left of the bar.
 */

function ProgressLoadingBar({ progress }) {
  return CustomizableRenderComponent({
    customizationId: 'ui.ProgressLoadingBar',
    progress,
  });
}

export default ProgressLoadingBar;
