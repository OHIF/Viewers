import React from 'react';
import { ToolButton } from '@ohif/ui-next';

interface ReturnToXNATButtonProps {
  id: string;
  onInteraction: (interaction: any) => void;
  servicesManager: any;
}

export default function ReturnToXNATButton({
  id,
  onInteraction,
  servicesManager,
}: ReturnToXNATButtonProps) {
  const handleInteraction = () => {
    // Navigate back to XNAT by removing /VIEWER from current path
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    
    const xnatPath = window.location.origin + window.location.pathname.split('VIEWER')[0];
    console.log('XNAT path:', xnatPath);
    
    window.location.href = xnatPath;
  };

  return (
    <ToolButton
      id={id}
      icon="external-link"
      label="Return to XNAT"
      tooltip="Return to XNAT interface"
      onInteraction={handleInteraction}
    />
  );
}
