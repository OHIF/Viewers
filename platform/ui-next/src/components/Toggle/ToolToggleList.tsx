import React, { useEffect, useState } from 'react';
import { Toggle } from './Toggle';
import { Icons } from '@ohif/ui-next';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '../../components/Tooltip/Tooltip';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../components/DropdownMenu/DropdownMenu';

/**
 * ToolToggleList
 * --------------
 * A split-button style toggle that displays a primary tool icon/label
 * and a dropdown arrow for secondary tool items. Selecting a secondary tool
 * updates the primary tool shown on the button and notifies `onInteraction`.
 *
 * Props:
 *  - id: string (main tool id)
 *  - icon: string (main tool icon name)
 *  - label: string (main tool label)
 *  - commands: any (commands for the main tool)
 *  - isActive: boolean (whether the current tool is active)
 *  - disabled: boolean (disable the entire control)
 *  - onInteraction: callback, called with { itemId, commands }
 *  - dropdownItems: array of { id, icon, label, commands } for secondary tools
 */

export default function ToolToggleList({
  id,
  icon,
  label,
  commands,
  isActive = false,
  disabled = false,
  onInteraction,
  className,
  dropdownItems = [], // array of secondary tools e.g. [{ id, icon, label, commands }, ...]
  ...rest
}) {
  // Pressed state for the main button, synced to isActive
  const [pressed, setPressed] = useState(isActive);

  // Keep track of which tool is currently “selected” (the main tool).
  // By default, it's the primary one (id, icon, label, commands).
  const [selectedTool, setSelectedTool] = useState({ id, icon, label, commands });

  // Sync pressed state if parent changes isActive
  useEffect(() => {
    setPressed(isActive);
  }, [isActive]);

  /**
   * handlePressedChange
   * When the user clicks the main button, we can optionally prevent un-toggle
   * by ignoring newPressed === false if we want the tool to stay on.
   */
  const handlePressedChange = newPressed => {
    // Example: keep it pressed if user tries to un-toggle
    const finalPressed = pressed && newPressed === false ? true : newPressed;
    setPressed(finalPressed);

    if (!disabled && onInteraction) {
      // Fire onInteraction with whichever tool is selected (the main one)
      onInteraction({
        itemId: selectedTool.id,
        commands: selectedTool.commands,
      });
    }
  };

  /**
   * handleSelectTool
   * Called when user picks a secondary tool from the dropdown.
   * We update the main button’s icon/label, and press it on.
   */
  const handleSelectTool = item => {
    setSelectedTool(item);
    setPressed(true);
    // Also notify parent that a new tool is active
    if (!disabled && onInteraction) {
      onInteraction({
        itemId: item.id,
        commands: item.commands,
      });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <div className="flex items-center space-x-1">
          {/* --- Main Tool Button --- */}
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
              {selectedTool.icon && (
                <Icons.ByName
                  name={selectedTool.icon}
                  className="h-7 w-7 flex-shrink-0"
                />
              )}
            </Toggle>
          </TooltipTrigger>

          {/* --- Dropdown Arrow (shows secondary tools) --- */}
          {dropdownItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Toggle
                  pressed={false}
                  variant="tool"
                  size="default"
                  disabled={disabled}
                  className="p-1"
                >
                  <Icons.ByName
                    name="chevron-down"
                    className="h-4 w-4"
                  />
                </Toggle>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                side="bottom"
                align="end"
              >
                {dropdownItems.map(item => (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => handleSelectTool(item)}
                    className="flex items-center space-x-2"
                  >
                    {item.icon && (
                      <Icons.ByName
                        name={item.icon}
                        className="h-4 w-4"
                      />
                    )}
                    <span>{item.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Show tooltip if the main label is present */}
        {label && <TooltipContent>{selectedTool.label}</TooltipContent>}
      </Tooltip>
    </TooltipProvider>
  );
}
