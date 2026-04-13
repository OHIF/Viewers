import React, { useEffect, useState } from 'react';
import { ToolButton } from '@ohif/ui-next';
import { dentalThemeManager } from '../dentalThemeManager';

function ComputerThemeIcon({ active }: { active: boolean }): React.ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={active ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <g id="computer">
        <rect x="1.5" y="1.5" width="21" height="16.23" rx="2.86" />
        <polygon points="15.82 22.5 8.18 22.5 9.14 17.73 14.86 17.73 15.82 22.5" />
        <line x1="18.68" y1="22.5" x2="5.32" y2="22.5" />
        <path d="M8.18,9.14h0A2.86,2.86,0,0,1,11,12v1a0,0,0,0,1,0,0H5.32a0,0,0,0,1,0,0V12A2.86,2.86,0,0,1,8.18,9.14Z" />
        <circle cx="8.18" cy="7.23" r="1.91" />
        <path d="M19.64,13h0Z" />
        <line x1="13.91" y1="7.23" x2="19.64" y2="7.23" />
        <line x1="16.77" y1="4.36" x2="16.77" y2="10.09" />
      </g>
    </svg>
  );
}

export default function DentalThemeToggleButton(): React.ReactElement {
  const [isDentalTheme, setIsDentalTheme] = useState<boolean>(() => dentalThemeManager.isActive());

  useEffect(() => {
    const unsubscribe = dentalThemeManager.subscribe(() => {
      setIsDentalTheme(dentalThemeManager.isActive());
    });
    return unsubscribe;
  }, []);

  return (
    <ToolButton
      id="DentalThemeToggle"
      label={isDentalTheme ? 'Default Theme' : 'Dental Theme'}
      tooltip={isDentalTheme ? 'Switch to Default Theme' : 'Switch to Dental Theme'}
      isActive={isDentalTheme}
      onInteraction={() => dentalThemeManager.setActive(!isDentalTheme)}
    >
      {isDentalTheme! ? <ComputerThemeIcon active={false} /> : <ComputerThemeIcon active={true} />}
    </ToolButton>
  );
}
