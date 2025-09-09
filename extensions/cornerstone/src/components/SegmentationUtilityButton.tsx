import React from 'react';

import { Button } from '@ohif/ui-next';

interface SegmentationUtilityButtonProps {
  onInteraction: (details: { itemId: string; commands?: Record<string, unknown> }) => void;
  disabled: boolean;
  id: string;
  commands: Record<string, unknown>;
}

function SegmentationUtilityButton(props: SegmentationUtilityButtonProps) {
  const { onInteraction, disabled, id: itemId, commands } = props;

  return (
    <Button
      onClick={() => {
        if (!disabled) {
          onInteraction?.({ itemId, commands });
        }
      }}
      {...props}
    />
  );
}

export default SegmentationUtilityButton;
