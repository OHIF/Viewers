import React from 'react';
import { useSystem } from '@ohif/core';
import { Replaceable, useViewportDialog } from '@ohif/ui-next';

/** The viewport dialog notification of one viewport. */
function ViewportNotification(props: { viewportId: string }) {
  const { viewportId } = props;
  const { servicesManager } = useSystem();
  const [viewportDialogState] = useViewportDialog();
  const Notification = servicesManager.services.customizationService.getCustomization(
    'ui.notificationComponent'
  ) as React.ComponentType<Record<string, unknown>>;
  const isShown = viewportDialogState.viewportId === viewportId;

  return (
    <Replaceable
      id="viewportNotification"
      props={props}
      viewportDialogState={viewportDialogState}
      isShown={isShown}
    >
      {/* top offset of 24px to account for ViewportActionCorners. */}
      <div className="absolute top-[24px] w-full">
        {isShown && (
          <Notification
            id="viewport-notification"
            message={viewportDialogState.message}
            type={viewportDialogState.type}
            actions={viewportDialogState.actions}
            onSubmit={viewportDialogState.onSubmit}
            onOutsideClick={viewportDialogState.onOutsideClick}
            onKeyPress={viewportDialogState.onKeyPress}
          />
        )}
      </div>
    </Replaceable>
  );
}

export default ViewportNotification;
