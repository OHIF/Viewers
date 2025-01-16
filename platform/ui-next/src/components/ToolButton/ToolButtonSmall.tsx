import React from 'react';
import { cn } from '../../lib/utils';
import ToolButton from './ToolButton';

interface ToolButtonSmallProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  disabled?: boolean;
  commands?: any;
  onInteraction?: (details: { itemId: string; commands?: any }) => void;
  className?: string;
}

/**
 * ToolButtonSmall
 *
 * A single "small" tool button that uses <ToolButton> under the hood
 * but applies smaller styling. Each instance represents exactly one button/item.
 */
function ToolButtonSmall(props: ToolButtonSmallProps) {
  const { id, icon, label, tooltip, isActive, disabled, commands, onInteraction, className } =
    props;

  // Handle clicks by notifying the parent
  const handleClick = () => {
    onInteraction?.({ itemId: id, commands });
  };

  // We apply smaller sizing (h-9 w-9, text-xs, etc.)
  // Then pass everything else to ToolButton for the actual rendering & tooltip
  return (
    <ToolButton
      id={id}
      icon={icon}
      label={label}
      tooltip={tooltip}
      isActive={isActive}
      disabled={disabled}
      commands={commands}
      className={cn('h-9 w-9 text-xs', className)}
      onInteraction={handleClick}
    />
  );
}

export { ToolButtonSmall };
export default ToolButtonSmall;
