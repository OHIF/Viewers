---
sidebar_position: 4
sidebar_label: Pub Sub
---

# Pub sub

## Overview

Publish–subscribe pattern is a messaging pattern that is one of the fundamentals
patterns used in reusable software components.

In short, services that implement this pattern, can have listeners subscribed
to their broadcasted events. After the event is fired, the corresponding
listener will execute the function that is registered.

You can read more about this design pattern
[here](https://cloud.google.com/pubsub/docs/overview).

## Example: Default Initialization

In `Mode.jsx` we have a default initialization that demonstrates a series of
subscriptions to various events.

```js
async function defaultRouteInit({
  servicesManager,
  studyInstanceUIDs,
  dataSource,
}) {
  const {
    DisplaySetService,
    HangingProtocolService,
  } = servicesManager.services;

  const unsubscriptions = [];

  const {
    unsubscribe: instanceAddedUnsubscribe,
  } = DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.INSTANCES_ADDED,
    ({ StudyInstanceUID, SeriesInstanceUID, madeInClient = false }) => {
      const seriesMetadata = DicomMetadataStore.getSeries(
        StudyInstanceUID,
        SeriesInstanceUID
      );

      DisplaySetService.makeDisplaySets(seriesMetadata.instances, madeInClient);
    }
  );

  unsubscriptions.push(instanceAddedUnsubscribe);

  studyInstanceUIDs.forEach(StudyInstanceUID => {
    dataSource.retrieve.series.metadata({ StudyInstanceUID });
  });

  const { unsubscribe: seriesAddedUnsubscribe } = DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.SERIES_ADDED,
    ({ StudyInstanceUID }) => {
      HangingProtocolService.run({studies, displaySets, activeStudy});
    }
  );
  unsubscriptions.push(seriesAddedUnsubscribe);

  return unsubscriptions;
}
```

## Unsubscription

You need to be careful if you are adding custom subscriptions to the app. Each
subscription will return an unsubscription function that needs to be executed on
component destruction to avoid adding multiple subscriptions to the same
observer.

Below, we can see `simplified` `Mode.jsx` and the corresponding `useEffect`
where the unsubscription functions are executed upon destruction.

```js title="platform/app/src/routes/Mode/Mode.jsx"
export default function ModeRoute(/**..**/) {
  /**...**/
  useEffect(() => {
    /**...**/

    DisplaySetService.init(extensionManager, sopClassHandlers);

    extensionManager.onModeEnter();
    mode?.onModeEnter({ servicesManager, extensionManager });

    const setupRouteInit = async () => {
      if (route.init) {
        return await route.init(/**...**/);
      }

      return await defaultRouteInit(/**...**/);
    };

    let unsubscriptions;
    setupRouteInit().then(unsubs => {
      unsubscriptions = unsubs;
    });

    return () => {
      extensionManager.onModeExit();
      mode?.onModeExit({ servicesManager, extensionManager });
      unsubscriptions.forEach(unsub => {
        unsub();
      });
    };
  });
  return <> /**...**/ </>;
}
```
