import ExamplePanel from './panels/ExamplePanel';

/**
 * Registers side panels. This entry becomes
 * `{{name}}.panelModule.examplePanel`; modes list that id in their
 * leftPanels/rightPanels arrays.
 */
export default function getPanelModule({ servicesManager, commandsManager }) {
  return [
    {
      name: 'examplePanel',
      iconName: 'tab-linear',
      iconLabel: '{{dirName}}',
      label: 'Example Panel',
      component: ExamplePanel,
    },
  ];
}
