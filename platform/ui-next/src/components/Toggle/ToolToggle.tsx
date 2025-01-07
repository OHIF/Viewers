import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Toggle } from './Toggle';
import { Icons } from '@ohif/ui-next';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../../components/Tooltip/Tooltip';

/**
 * ToolToggle
 * ----------
 * A generic toggle-based tool button that uses Radix Toggle + cva styling
 * + your custom Tooltip to display the tool name on hover.
 */
export default function ToolToggle({
  id,
  icon,
  label,
  commands,
  isActive = false,
  disabled = false,
  onInteraction,
  className,
  ...rest
}) {
  // Local "pressed" state to sync with isActive
  const [pressed, setPressed] = useState(isActive);

  useEffect(() => {
    setPressed(isActive);
  }, [isActive]);

  /**
   * handlePressedChange
   * We can optionally block toggling off by ignoring newPressed === false
   * if we want this tool to remain "on" until replaced by another tool, etc.
   */
  const handlePressedChange = newPressed => {
    // Example logic: keep it pressed if we detect an attempt to un-toggle
    const finalPressed = pressed && newPressed === false ? true : newPressed;

    setPressed(finalPressed);

    if (!disabled && onInteraction) {
      onInteraction({
        itemId: id,
        commands,
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Toggle
            pressed={pressed}
            onPressedChange={handlePressedChange}
            variant="tool"
            size="default"
            disabled={disabled}
            className={className}
            {...rest}
          >
            {icon && (
              <Icons.ByName
                name={icon}
                className="h-7 w-7 flex-shrink-0"
              />
            )}
          </Toggle>
        </TooltipTrigger>

        {/* Only show tooltip if a label exists */}
        {label && <TooltipContent>{label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}

ToolToggle.propTypes = {
  id: PropTypes.string.isRequired,
  icon: PropTypes.string,
  label: PropTypes.string,
  commands: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  isActive: PropTypes.bool,
  disabled: PropTypes.bool,
  onInteraction: PropTypes.func,
  className: PropTypes.string,
};
