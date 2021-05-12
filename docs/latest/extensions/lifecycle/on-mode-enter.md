# Lifecycle Hook: onModeEnter

If an extension defines the `onModeEnter` lifecycle hook, it is called
when a new mode is enters, or a mode's data or datasource is switched.

For instance, in DICOM structured report extension (`dicom-sr`), we are using
`onModeEnter` to re-create the displaySets after a new mode is entered.

_Example `onModeEnter` hook implementation_

```js
export default {
  id: 'org.ohif.dicom-sr',

  onModeEnter({ servicesManager}) {
    const { DisplaySetService } = servicesManager.services;
    const displaySetCache = DisplaySetService.getDisplaySetCache();

    const srDisplaySets = displaySetCache.filter(
      ds => ds.SOPClassHandlerId === SOPClassHandlerId
    );

    srDisplaySets.forEach(ds => {
      // New mode route, allow SRs to be hydrated again
      ds.isHydrated = false;
    });
  },
};
```
