import MultimonitorLayout from './MultiMonitor/MultiMonitorLayout';
/*
- Define layout for the viewer in mode configuration.
- Pass in the viewport types that can populate the viewer.
- Init layout based on the displaySets and the objects.
*/

export default function ({ servicesManager, extensionManager, commandsManager, hotkeysManager }) {
  function MultimonitorLayoutWithServices(props) {
    return MultimonitorLayout({
      servicesManager,
      extensionManager,
      commandsManager,
      hotkeysManager,
      ...props,
    });
  }

  return [
    {
      name: 'multimonitorLayout',
      id: 'multimonitorLayout',
      component: MultimonitorLayoutWithServices,
    },
  ];
}
