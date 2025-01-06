import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Toggle } from './Toggle';
import { Icons } from '@ohif/ui-next';
import { ButtonProps } from '@ohif/core';
// ^ If you want to type it similarly to how OHIF’s toolbar expects button definitions

/**
 * A generic toggle-based tool button that can be used for Zoom or any other tool.
 * It uses the Shadcn <Toggle> under the hood, but can read "isActive", "disabled" from evaluate, etc.
 */
export default function ToolToggle({
  id,
  icon,
  label,
  commands,
  // If a tool is "active" we might highlight the toggle
  isActive = false,
  disabled = false,
  // Additional text if disabled
  disabledText,
  onInteraction,
  evaluate, // if you want to handle dynamic logic
  className,
  ...rest
}) {
  // Use local state to store pressed or rely on "isActive" from evaluate
  const [pressed, setPressed] = useState(isActive);

  // If "isActive" changes from parent evaluate, reflect that in local state:
  useEffect(() => {
    setPressed(isActive);
  }, [isActive]);

  // If tool is disabled, we might skip toggling or skip onInteraction
  // or just let the "Toggle" handle pointer-events: none
  const handlePressedChange = newPressed => {
    setPressed(newPressed);

    // If not disabled, run the commands (which typically sets the tool active)
    if (!disabled && onInteraction) {
      onInteraction({
        itemId: id,
        commands,
      });
    }
  };

  return (
    <Toggle
      // Shadcn toggle props
      pressed={pressed}
      onPressedChange={handlePressedChange}
      variant="tool"
      size="default"
      disabled={disabled}
      // Merge any custom classes that you or evaluate might provide:
      className={className}
      {...rest}
    >
      {/* Icon + label */}
      {icon && (
        <Icons.ByName
          name={icon}
          className="h-7 w-7 flex-shrink-0"
        />
      )}
    </Toggle>
  );
}

ToolToggle.propTypes = {
  id: PropTypes.string.isRequired,
  icon: PropTypes.string,
  label: PropTypes.string,
  commands: PropTypes.oneOfType([PropTypes.array, PropTypes.object, PropTypes.string]),
  isActive: PropTypes.bool,
  disabled: PropTypes.bool,
  disabledText: PropTypes.string,
  onInteraction: PropTypes.func,
  evaluate: PropTypes.any,
  className: PropTypes.string,
};
