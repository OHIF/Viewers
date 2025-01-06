import React, { useEffect, useState } from 'react';
import { Toggle } from './Toggle';
import { Icons } from '@ohif/ui-next';

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
  const [pressed, setPressed] = useState(isActive);

  // Keep local “pressed” in sync with parent’s “isActive”
  useEffect(() => {
    setPressed(isActive);
  }, [isActive]);

  // Decide exactly how to handle toggling:
  const handlePressedChange = newPressed => {
    // If you want to ignore attempts to un-toggle:
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
  );
}
