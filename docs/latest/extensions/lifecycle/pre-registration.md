# Lifecylce Hook: preRegistration

If an extension defines the `preRegistration` lifecycle hook, it is called
before any modules are registered in the `ExtensionManager`. This hook can be
used to:

- initialize 3rd party libraries
- register event listeners
- add or call services
- add or call commands

The `preRegistration` hook receives an object containing the
`ExtensionManager`'s associated `ServicesManager`, `CommandsManager`, and any
`configuration` that was provided with the extension at time of registration.

Example `preRegistration` implementation that register a new service and make it
available in the app. We will talk more in details for creating a new service for
`OHIF-v3`.

```js

// new service inside new extension
import MyNewService from './MyNewService';

export default function MyNewServiceWithServices(serviceManager) {
  return {
    name: 'MyNewService',
    create: ({ configuration = {} }) => {
      return new MyNewService(serviceManager);
    },
  };
}
```

and

```js
import MyNewService from './MyNewService'

export default {
  id: 'MyExampleExtension',

  /**
   * @param {object} params
   * @param {object} params.configuration
   * @param {ServicesManager} params.servicesManager
   * @param {CommandsManager} params.commandsManager
   * @returns void
   */
  preRegistration({ servicesManager, commandsManager, configuration }) {
    console.log('Wiring up important stuff.');

    window.importantStuff = () => {
      console.log(configuration);
    };

    console.log('Important stuff has been wired.');
    window.importantStuff();

    // Registering new services
    servicesManager.registerService(MyNewService(servicesManager));
  },
  },
};
```
