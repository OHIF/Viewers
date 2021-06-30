# Lifecylce Hook: onModeExit

If an extension defines the `onModeExit` lifecycle hook, it is called when navigating
away from a mode. This hook can be used to clean up data tasks such as unregistering services,
removing annotations that do not need to be persisted.

_Example `onModeExit` hook implementation_

```js
export default {
  id: 'myExampleExtension',

  onModeExit({ servicesManager, commandsManager}) {
    myCacheServie.purge()
  },
};
```
