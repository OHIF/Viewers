---
id: state-sync-service
title: StateSyncService
summary: Migration guide for transitioning from StateSyncService to Zustand stores in OHIF 3.9, covering all store types including LutPresentationStore, PositionPresentationStore, ViewportGridStore, and more with examples of old and new API usage.
---


## Migrating from StateSyncService to Zustand Stores

The `StateSyncService` has been deprecated in favor of more modern and efficient state management using Zustand stores. This migration guide outlines the reasons for the change and provides step-by-step instructions on how to migrate your extension or mode from using `StateSyncService` to Zustand.

## Why Migrate?

The `StateSyncService` had limitations:

- **Limited Reactivity:** Updates weren't always reactive, requiring manual re-renders.
- **Lack of Granularity:** It stored large chunks of state, hindering performance.
- **Complexity:** Managing and syncing state across components was cumbersome.

Zustand offers several advantages:

- **Lightweight and Fast:** Zustand is a minimal and performant state management library.
- **Granular Control:** Create individual stores for specific data, improving reactivity and performance.
- **Simplified API:** Easy-to-use hooks for subscribing and updating state.

## Migration Steps:

1. **Identify State to Migrate:** Determine which parts of your extension or mode rely on the `StateSyncService`. Typical examples include:
    - **Viewport Presentations:** LUT and position information for viewports.
    - **Layout State:** Custom grid layouts and one-up toggling.
    - **Synchronizers:** State for cross-viewport synchronization.
    - **UI State:** UI-specific settings.
2. **Replace StateSyncService Usage:** In your extension or mode:
    - **Import Zustand Stores:** Import the new stores you created.
    - **Replace** `getState()` and `store()`: Use the Zustand hooks (`useStore`, `set`, `get`) to access and update state in your components.
    - **Handle Presentation IDs:** Implement logic for generating and managing presentation IDs within your stores or relevant components. This can involve using unique keys based on viewport options, display sets, and unique indices. See the `presentationUtils.ts` file for example implementations.
    - **Rehydrate State:** On mode entry, rehydrate your Zustand stores with any relevant persisted state from localStorage or other storage mechanisms.
    - **Clear State on Mode Exit:** Ensure you clear your Zustand stores appropriately on mode exit to prevent memory leaks.



### `LutPresentationStore`


**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const lutPresentationStore = stateSyncService.getState().lutPresentationStore;
const lutPresentation = lutPresentationStore[presentationId];
// ...to update
stateSyncService.store({
  lutPresentationStore: {
    ...lutPresentationStore,
    [presentationId]: newLutPresentation,
  },
});
```

**After (Zustand):**

```js
import { useLutPresentationStore } from '../stores/useLutPresentationStore';
const { lutPresentationStore, setLutPresentation } = useLutPresentationStore();
const lutPresentation = lutPresentationStore[presentationId];
// ...to update
setLutPresentation(presentationId, newLutPresentation);
```

The `getPresentationId` for `lutPresentationStore` was previously registered in `platform/core`. Now, the Zustand store provides this functionality.

```js
// Fetch getPresentationId functions from respective Zustand stores
const { getPresentationId: getLutPresentationId } = useLutPresentationStore.getState();

// Register presentation id providers
viewportGridService.addPresentationIdProvider('lutPresentationId', getLutPresentationId);
```


---

### `PositionPresentationStore`

**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const positionPresentationStore = stateSyncService.getState().positionPresentationStore;
const positionPresentation = positionPresentationStore[presentationId];
// ...to update
stateSyncService.store({
  positionPresentationStore: {
    ...positionPresentationStore,
    [presentationId]: newPositionPresentation,
  },
});
```

**After (Zustand):**

```js
import { usePositionPresentationStore } from '../stores/usePositionPresentationStore';
const { positionPresentationStore, setPositionPresentation } = usePositionPresentationStore();
const positionPresentation = positionPresentationStore[presentationId];
// ...to update
setPositionPresentation(presentationId, newPositionPresentation);
```

Similar to lutPresentationId, the PositionPresentationId is also registered from outside

```js

  const { getPresentationId: getPositionPresentationId } = usePositionPresentationStore.getState();

  // register presentation id providers
  viewportGridService.addPresentationIdProvider(
    'positionPresentationId',
    getPositionPresentationId
  );
```

---

### `ViewportGridStore`

**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const viewportGridStore = stateSyncService.getState().viewportGridStore;
const gridState = viewportGridStore[storeId];
// ...to update
stateSyncService.store({
  viewportGridStore: {
    ...viewportGridStore,
    [storeId]: newGridState,
  },
});
```

**After (Zustand):**

```js
import { useViewportGridStore } from '../stores/useViewportGridStore';
const { viewportGridState, setViewportGridState } = useViewportGridStore.getState();
const gridState = viewportGridState[storeId];
// ...to update
setViewportGridState(storeId, newGridState);
```

---

### `DisplaySetSelectorStore`


**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const displaySetSelectorMap = stateSyncService.getState().displaySetSelectorMap;
const displaySetUID = displaySetSelectorMap[selectorKey];
// ...to update
stateSyncService.store({
  displaySetSelectorMap: {
    ...displaySetSelectorMap,
    [selectorKey]: newDisplaySetUID,
  },
});
```

**After (Zustand):**

```js
import { useDisplaySetSelectorStore } from '../stores/useDisplaySetSelectorStore';
const { displaySetSelectorMap, setDisplaySetSelector } = useDisplaySetSelectorStore();
const displaySetUID = displaySetSelectorMap[selectorKey];
// ...to update
setDisplaySetSelector(selectorKey, newDisplaySetUID);
```

---

### `HangingProtocolStageIndexStore`


**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const hangingProtocolStageIndexMap = stateSyncService.getState().hangingProtocolStageIndexMap;
const hpInfo = hangingProtocolStageIndexMap[cacheId];
// ...to update
stateSyncService.store({
  hangingProtocolStageIndexMap: {
    ...hangingProtocolStageIndexMap,
    [cacheId]: newHpInfo,
  },
});
```

**After (Zustand):**

```js
import { useHangingProtocolStageIndexStore } from '../stores/useHangingProtocolStageIndexStore';
const { hangingProtocolStageIndexMap, setHangingProtocolStageIndex } = useHangingProtocolStageIndexStore();
const hpInfo = hangingProtocolStageIndexMap[cacheId];
// ...to update
setHangingProtocolStageIndex(cacheId, newHpInfo);
```

---

### `ToggleHangingProtocolStore`


**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const toggleHangingProtocol = stateSyncService.getState().toggleHangingProtocol;
const previousHpInfo = toggleHangingProtocol[storedHanging];
// ...to update
stateSyncService.store({
  toggleHangingProtocol: {
    ...toggleHangingProtocol,
    [storedHanging]: newHpInfo,
  },
});
```

**After (Zustand):**

```js
import { useToggleHangingProtocolStore } from '../stores/useToggleHangingProtocolStore';
const { toggleHangingProtocol, setToggleHangingProtocol } = useToggleHangingProtocolStore();
const previousHpInfo = toggleHangingProtocol[storedHanging];
// ...to update
setToggleHangingProtocol(storedHanging, newHpInfo);
```

---

### `ToggleOneUpViewportGridStore`


**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const toggleOneUpViewportGridStore = stateSyncService.getState().toggleOneUpViewportGridStore;
const previousGridState = toggleOneUpViewportGridStore.layout; // Assuming layout was a property
// ...to update
stateSyncService.store({
  toggleOneUpViewportGridStore: newGridState,
});
```

**After (Zustand):**

```js
import { useToggleOneUpViewportGridStore } from '../stores/useToggleOneUpViewportGridStore';
const { toggleOneUpViewportGridStore, setToggleOneUpViewportGridStore } = useToggleOneUpViewportGridStore();
const previousGridState = toggleOneUpViewportGridStore; // No nested layout property
// ...to update
setToggleOneUpViewportGridStore(newGridState);
```

---

### `UIStateStore`


**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const uiState = stateSyncService.getState().uiStateStore[someUIKey];
// ...to update
stateSyncService.store({
  uiStateStore: {
    ...stateSyncService.getState().uiStateStore,
    [someUIKey]: newUIState,
  },
});
```

**After (Zustand):**

```js
import { useUIStateStore } from '../stores/useUIStateStore';
const { uiState, setUIState } = useUIStateStore();
const currentUIState = uiState[someUIKey];
// ...to update
setUIState(someUIKey, newUIState);
```

---

### `ViewportsByPositionStore`


**Before (StateSyncService):**

```js
const stateSyncService = servicesManager.services.stateSyncService;
const viewportsByPosition = stateSyncService.getState().viewportsByPosition;
const cachedViewport = viewportsByPosition[positionId];
// ...to update
stateSyncService.store({
  viewportsByPosition: {
    ...viewportsByPosition,
    [positionId]: newViewport,
  },
});
```

**After (Zustand):**

```js
import { useViewportsByPositionStore } from '../stores/useViewportsByPositionStore';
const { viewportsByPosition, setViewportsByPosition } = useViewportsByPositionStore();
const cachedViewport = viewportsByPosition[positionId];
// ...to update
setViewportsByPosition(positionId, newViewport);
```

---

### `SegmentationPresentationStore`

**After (Zustand):**

```js
import { useSegmentationPresentationStore } from '../stores/useSegmentationPresentationStore';
const { segmentationPresentationStore, setSegmentationPresentation } =
  useSegmentationPresentationStore();
// ...to update
setSegmentationPresentation(presentationId, newSegmentationPresentation);
// You likely have functions within the store like:
// addSegmentationPresentation
// setSegmentationVisibility
// etc.
```
