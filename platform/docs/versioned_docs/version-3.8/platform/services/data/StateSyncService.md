---
sidebar_position: 8
sidebar_label: State Sync
---

# State Sync

## Overview

Applications often need a way to save and restore state, allowing users to continue their work seamlessly across sessions or after restarts. This is essential for keeping user preferences, preserving app context, and providing a consistent experience. For example, hanging protocol layouts, and window level improves user interactions, allowing for smooth navigation between protocols and restoring layouts upon returning. This document explains how to manage and sync state in the application using Zustand stores, providing built-in state stores and tools for extensions to create and manage their own.


## Built-in Zustand Stores

The following stores are available for managing different aspects of application state:

* **`useLutPresentationStore`**: Manages LUT (window level) presentation state.  Key features:
    * `setLutPresentation(key, value)`: Sets a LUT presentation for a given `key`.
    * `clearLutPresentationStore()`: Clears all stored LUT presentations.
    * `getPresentationId(id, options)`: Retrieves the presentation ID based on viewport and display set information.

* **`usePositionPresentationStore`**: Manages viewport position (camera, initial image) state. Key features:
    * `setPositionPresentation(key, value)`: Sets a position presentation for a given `key`.
    * `clearPositionPresentationStore()`: Clears all stored position presentations.
    * `getPresentationId(id, options)`: Retrieves the presentation ID based on viewport and display set information.
    * `getPositionPresentationId(viewport, viewports?, isUpdatingSameViewport?)`:  Gets the position presentation ID.

* **`useSegmentationPresentationStore`**: Manages segmentation presentation state. Key features:
    * `setSegmentationPresentation(presentationId, value)`: Sets a segmentation presentation for a given `presentationId`.
    * `clearSegmentationPresentationStore()`: Clears all stored segmentation presentations.
    * `getPresentationId(id, options)`: Retrieves the presentation ID based on viewport, display set, and services manager information.
    * `addSegmentationPresentation(presentationId, segmentationPresentation, { servicesManager })`: Adds a new segmentation presentation.
    * `getSegmentationPresentationId({ viewport, servicesManager })`: Retrieves the current segmentation presentation ID.

* **`useSynchronizersStore`**: Manages viewport synchronization state. Key features:
    * `setSynchronizers(viewportId, synchronizers)`: Sets synchronizers for a specific viewport.
    * `clearSynchronizersStore()`: Clears the entire synchronizers store.


## Creating Custom State Stores with Zustand

Extensions can create their own Zustand stores to manage custom state.  This approach leverages Zustand's simplicity and performance.

```javascript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Define your state shape
interface MyCustomState {
  count: number;
  increment: () => void;
  reset: () => void;
}

// Create your store
const useMyCustomStore = create<MyCustomState>()(
  devtools((set) => ({
    count: 0,
    increment: () => set((state) => ({ count: state.count + 1 })),
    reset: () => set({ count: 0 }),
  }), { name: 'MyCustomStore' }) // Use devtools for debugging
);

// Use the store in your component
function MyComponent() {
  const { count, increment, reset } = useMyCustomStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>Increment</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### Best Practices

* **Naming:** Use a clear and descriptive name for your store, prefixed with `use`, e.g., `useMyCustomStore`.
* **Typing:** Define the state interface using TypeScript for better type safety and code maintainability.
* **Devtools:** Use the `devtools` middleware in development to easily inspect and debug your store's state changes.
* **State Updates:** Use the `set` function to update the state, ensuring immutability by returning a new state object or using the callback form to access the previous state.



## Migration from Legacy State Sync Service

Existing extensions using the legacy `stateSyncService` should migrate to using individual Zustand stores.  This involves:

1.  Creating a new Zustand store for each piece of state previously managed by `stateSyncService`.
2.  Updating the extension code to use the new store instead of `stateSyncService`.
3.  Removing the legacy `stateSyncService` registration code.
