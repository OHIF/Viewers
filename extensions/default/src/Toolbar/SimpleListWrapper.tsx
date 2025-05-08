import React from 'react';
import { useToolbar } from '@ohif/core/src';

function SimpleListWrapper({ buttonSection }: { buttonSection: string }) {
  const { toolbarButtons } = useToolbar({ buttonSection });
  return (
    <div>
      {toolbarButtons.map(button => (
        <div key={button.id}>{button.id}</div>
      ))}
    </div>
  );
}

export default SimpleListWrapper;
