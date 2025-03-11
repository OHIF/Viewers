// File: platform/ui-next/src/components/LayoutSelector/LayoutPreset.tsx

import React from 'react';
import { Icons } from '@ohif/ui-next';

interface LayoutPresetProps {
  title?: string;
  icon: string;
  commandOptions: Record<string, any>;
  onSelection: (commandOptions: Record<string, any>) => void;
  disabled?: boolean;
  className?: string;
}

const LayoutPreset: React.FC<LayoutPresetProps> = ({
  title,
  icon,
  commandOptions,
  onSelection,
  disabled = false,
  className = '',
}) => {
  const handleClick = () => {
    if (!disabled) {
      onSelection(commandOptions);
    }
  };

  return (
    <div
      className={`flex cursor-pointer items-center gap-2 p-1 ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
      } ${className}`}
      onClick={handleClick}
    >
      <Icons.ByName
        name={icon}
        className={`text-[1.25rem] ${disabled ? 'text-gray-400' : 'group-hover:text-primary-light'}`}
      />
      {title && <div className="font-inter whitespace-nowrap text-sm text-white">{title}</div>}
    </div>
  );
};

export default LayoutPreset;
