import React, { ReactElement } from 'react';
import CustomizableRenderComponent from '../../utils/CustomizableRenderComponent';
import './ProgressLoadingBar.css';

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
    FallbackComponent: FallbackProgressLoadingBar,
    progress,
  });
}
function FallbackProgressLoadingBar({ progress }: ProgressLoadingBarProps): ReactElement {
  return (
    <div className="loading border-fwdark-borderblue border">
      {progress === undefined || progress === null ? (
        <div className="infinite-loading-bar bg-fwdark-malibublue !mx-[1px] !h-[4px]"></div>
      ) : (
        <div
          className="bg-fwdark-malibublue m-[1px] rounded border border-transparent"
          style={{
            width: `${progress}%`,
            height: '4px',
          }}
        ></div>
      )}
    </div>
  );
}

export default ProgressLoadingBar;
