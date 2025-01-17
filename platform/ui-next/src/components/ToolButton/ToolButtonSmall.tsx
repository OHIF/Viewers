// File: /Users/danrukas/Documents/Github/Viewers/platform/ui-next/src/components/ToolButton/ToolButtonSmall.tsx
import React from 'react';
import ToolButton from './ToolButton';
import { cn } from '../../lib/utils';

interface ToolButtonSmallProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void; // You can also pass commands directly if desired
  className?: string;
}

/**
 * ToolButtonSmall
 * Wraps our base ToolButton but applies smaller styling,
 * as well as the primary-dark/primary-light color scheme
 * that you had in the original code.
 */
function ToolButtonSmall(props: ToolButtonSmallProps) {
  const {
    id,
    icon = 'MissingIcon',
    label,
    tooltip,
    isActive = false,
    disabled = false,
    onClick,
    className,
  } = props;

  // Combine your original styling classes with the ones from ToolButton
  const baseClasses =
    'relative flex items-center justify-center w-10 h-10 rounded-md transition-colors';
  const defaultClasses =
    'bg-primary-dark text-primary-active hover:bg-primary-light hover:text-black';
  const activeClasses = 'bg-highlight text-background';
  const disabledClasses = 'opacity-40 cursor-not-allowed';

  let appliedClasses: string;
  if (disabled) {
    appliedClasses = cn(baseClasses, disabledClasses, className);
  } else if (isActive) {
    appliedClasses = cn(baseClasses, activeClasses, className);
  } else {
    appliedClasses = cn(baseClasses, defaultClasses, className);
  }

  // We'll use onInteraction as the trigger for the click
  const handleInteraction = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  return (
    <ToolButton
      id={id}
      icon={icon}
      label={label}
      tooltip={tooltip}
      isActive={isActive}
      disabled={disabled}
      className={appliedClasses}
      // onInteraction is used by ToolButton
      onInteraction={() => handleInteraction()}
    />
  );
}

export default ToolButtonSmall;
