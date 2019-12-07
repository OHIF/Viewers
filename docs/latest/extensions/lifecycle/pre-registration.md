# Lifecylce Hook: preRegistration

If an extension defines the `preRegistration` lifecycle hook, it is called
before any modules are registered in the `ExtensionManager`.

```js
export default {
  id: 'MyExampleExtension',

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
