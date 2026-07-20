import ExampleViewport from './viewports/ExampleViewport';

/**
 * Registers viewport components. This entry becomes
 * `{{name}}.viewportModule.example`; modes reference that id in their layout
 * or hanging-protocol viewport definitions.
 */
export default function getViewportModule({ servicesManager, extensionManager }) {
  return [
    {
      name: 'example',
      component: props => <ExampleViewport {...props} servicesManager={servicesManager} />,
    },
  ];
}
