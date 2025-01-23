import React from 'react';
import ToolButton from './ToolButton';
import { cn } from '../../lib/utils';

interface ToolButtonGroupProps {
  id: string;
  icon?: string;
  label?: string;
  tooltip?: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  buttonSizeClass?: string;
  iconSizeClass?: string;
}

function ToolButtonGroup(props: ToolButtonGroupProps) {
  const {
    id,
    icon = 'MissingIcon',
    label,
    tooltip,
    buttonSizeClass = 'w-8 h-8',
    iconSizeClass = 'w-6 h-6',
    isActive = false,
    disabled = false,
    onClick,
    className,
  } = props;

  const baseClasses = 'relative flex items-center justify-center rounded-md transition-colors';
  const defaultClasses = 'bg-transparent hover:bg-transparent';
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
      onInteraction={() => handleInteraction()}
      buttonSizeClass={buttonSizeClass}
      iconSizeClass={iconSizeClass}
    />
  );
}

export default ToolButtonGroup;
