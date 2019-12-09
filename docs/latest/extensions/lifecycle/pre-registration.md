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

_Example `preRegistration` hook implementation_

```js
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
  },
};
```
