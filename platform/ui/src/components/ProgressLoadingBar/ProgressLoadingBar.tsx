import { useServices } from '@ohif/ui';

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
  const { services } = useServices();
  const Component = services.customizationService.getCustomization('ui.ProgressLoadingBar');
  return Component({
    progress,
  });
}

export default ProgressLoadingBar;
