---
title: useSessionStorage
summary: A React hook that provides sessionStorage access with automatic JSON parsing/stringifying and an option to clear data when the page unloads.
---

# useSessionStorage

The `useSessionStorage` hook provides a convenient way to store and retrieve data from the browser's sessionStorage with automatic JSON serialization and deserialization. It also offers the option to automatically clear the stored data when a page unloads.

## Overview

This hook wraps the browser's sessionStorage API to provide a more React-friendly interface. It handles JSON serialization/deserialization automatically and maintains the stored values in local state for reactive updates. The hook also includes a unique feature to clear specific items from sessionStorage when the page unloads, which is useful for temporary session data that shouldn't persist.

## Import

```js
import { useSessionStorage } from '@ohif/ui-next';
```

## Usage

```jsx
function UserPreferencesPanel() {
  const [preferences, setPreferences] = useSessionStorage({
    key: 'viewer-preferences',
    defaultValue: { theme: 'dark', fontSize: 'medium' },
    clearOnUnload: false,
  });

  const updateTheme = (theme) => {
    setPreferences({ ...preferences, theme });
  };

  return (
    <div>
      <h3>User Preferences</h3>
      <div>Current Theme: {preferences.theme}</div>
      <button onClick={() => updateTheme('light')}>Light Theme</button>
      <button onClick={() => updateTheme('dark')}>Dark Theme</button>
    </div>
  );
}

function TemporaryWorkspace() {
  const [workspace, setWorkspace] = useSessionStorage({
    key: 'temp-workspace',
    defaultValue: { annotations: [] },
    clearOnUnload: true, // This data will be cleared when the page unloads
  });

  return (
    <div>
      <h3>Temporary Workspace</h3>
      <p>This workspace will be cleared when you leave the page</p>
      {/* Workspace UI components */}
    </div>
  );
}
```

## Parameters

An options object with the following properties:

- `key` (required): The sessionStorage key under which to store the data
- `defaultValue` (optional): The default value to use if no data exists in sessionStorage for the given key. Defaults to an empty object (`{}`)
- `clearOnUnload` (optional): Whether to clear this item from sessionStorage when the page unloads. Defaults to `false`

## Returns

An array containing:

1. The current value from sessionStorage (parsed from JSON)
2. A function to update the value in both state and sessionStorage

The update function automatically handles JSON stringification of the data.

## Implementation Details

- The hook uses a global Map (`sessionItemsToClearOnUnload`) to track items that should be cleared when the page unloads.
- It utilizes the browser's `visibilitychange` event to implement the clearOnUnload feature. When the page becomes hidden (which happens both when switching tabs and when unloading), items marked for clearing are removed from sessionStorage.
- If the page later becomes visible again (e.g., when switching back to the tab), the items are restored from the Map.
- The hook's update function merges the new value with the current state using the spread operator, maintaining a similar behavior to React's `setState`.
- All data is automatically serialized to JSON before storing in sessionStorage and deserialized when retrieving.
