import React, { useCallback } from 'react';
import { cn, ToolButton } from '@ohif/ui-next';
import { useUIStateStore } from '@ohif/extension-default';

interface SegmentationUtilityButtonProps {
  className?: string;
  isActive?: boolean;
  id: string;
}

/**
 * A button that represents a segmentation utility.
 * It is implicitly the PopoverTrigger for the options Popover panel that is
 * opened in the PanelSegmentation component. It in essence is the PopoverTrigger
 * because typically this button has the associated options to display in the Popover.
 * Furthermore it also typically has a command for toggling the activeSegmentationUtility
 * value in the UIStateStore that triggers the fetching of its options.

 * @param props - The props for the button.
 * @param props.className - The class name for the button.
 * @param props.isActive - Whether the button is active
 * @param props.id - The id of the button.
 */
function SegmentationUtilityButton(props: SegmentationUtilityButtonProps) {
  const { className, isActive, id } = props;

  const activeSegmentationUtility = useUIStateStore(
    store => store.uiState.activeSegmentationUtility
  );

  const toolButtonClassName = cn(
    'w-7 h-7 text-primary hover:text-primary hover:!bg-primary/30',
    className,
    isActive && 'bg-primary/30'
  );

  const handleMouseDownCapture = useCallback(
    event => {
      if (activeSegmentationUtility === id) {
        // If this active button is clicked, prevent the default Popover
        // behaviour of closing the Popover on a pointer/mouse down.
        // Not doing this will cause the Popover to close and then reopen again.
        // Why? Because propagating this event will cause PanelSegmentation to
        // close the Popover by clearing the activeSegmentationUtility. Then
        // this button will set the activeSegmentationUtility again and the
        // Popover will reopen.
        event.preventDefault();
        event.stopPropagation();
      }
    },
    [activeSegmentationUtility, id]
  );

  return (
    <div onPointerDownCapture={handleMouseDownCapture}>
      <ToolButton
        {...props}
        className={toolButtonClassName}
      />
    </div>
  );
}

export default SegmentationUtilityButton;
