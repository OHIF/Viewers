import React from 'react';
import AIFindingsPanel from './panels/AIFindingsPanel';

function getPanelModule({ servicesManager }: { servicesManager: unknown }): Array<{
  name: string;
  iconName: string;
  iconLabel: string;
  label: string;
  component: () => React.ReactElement;
}> {
  return [
    {
      name: 'blackvoxel-ai-findings',
      iconName: 'tab-analysis',
      iconLabel: 'AI',
      label: 'Achados IA',
      component: () => <AIFindingsPanel servicesManager={servicesManager} />,
    },
  ];
}

export default getPanelModule;
