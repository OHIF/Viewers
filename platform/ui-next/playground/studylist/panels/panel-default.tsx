import React from 'react';
import { Summary } from './panel-summary';

export function PanelDefault({
  defaultMode,
  onDefaultModeChange,
}: {
  defaultMode: string | null
  onDefaultModeChange: (v: string | null) => void
}) {
  return (
    <Summary.Root>
      <Summary.Patient />
      <Summary.Workflows defaultMode={defaultMode} onDefaultModeChange={onDefaultModeChange} />
    </Summary.Root>
  );
}
