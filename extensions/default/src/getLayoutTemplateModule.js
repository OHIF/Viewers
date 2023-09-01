import ViewerLayout from './ViewerLayout';
/*
- Define layout for the viewer in mode configuration.
- Pass in the viewport types that can populate the viewer.
- Init layout based on the displaySets and the objects.
*/

export default function ({ servicesManager, extensionManager, commandsManager, hotkeysManager }) {
  function ViewerLayoutWithServices(props) {
    return ViewerLayout({
      servicesManager,
      extensionManager,
      commandsManager,
      hotkeysManager,
      ...props,
    });
  }

  return [
    // Layout Template Definition
    // TODO: this is weird naming
    {
      name: 'viewerLayout',
      id: 'viewerLayout',
      component: ViewerLayoutWithServices,
    },
  ];
}
