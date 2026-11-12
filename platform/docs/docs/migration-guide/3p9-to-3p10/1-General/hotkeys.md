---
sidebar_position: 2
title: Hotkeys
summary: Migration guide for hotkeys management in OHIF 3.10, explaining the transition from defining hotkeys in mode factory to using the customizationService, with examples of replacing, adding, and modifying hotkey bindings.
---


## Key Changes:

* Hotkeys are no longer defined in mode factory via `hotkeys: [...hotkeys.defaults.hotkeyBindings]`
* Hotkeys are now managed through the `customizationService` under the key `ohif.hotkeyBindings`
* Default hotkeys are set automatically and can be customized using the customization service
* User-defined hotkey preferences are now stored in a new format in localStorage
* The `HotkeysManager` has undergone significant updates including better handling of defaults, key persistence, and cleanup

## Migration Steps:

### 1. Remove hotkeys array from mode factory definition

**Before:**
```diff
- function modeFactory({ modeConfiguration }) {
-   return {
-     id: 'basic',
-     // ... other configuration
-     hotkeys: [...hotkeys.defaults.hotkeyBindings],
-   };
- }
```

**After:**
```diff
+ function modeFactory({ modeConfiguration }) {
+   return {
+     id: 'basic',
+     // ... other configuration
+     // No hotkeys array necessary
+   };
+ }
```


### 2. Set custom hotkeys using the customization service

There are several methods to modify hotkeys using the customization service:

#### a. Completely replace all hotkeys using `$set`:

```diff
+ onModeEnter: function ({ servicesManager }) {
+   const { customizationService } = servicesManager.services;
+   customizationService.setCustomizations({
+     'ohif.hotkeyBindings': {
+       $set: [
+         {
+           commandName: 'setToolActive',
+           commandOptions: { toolName: 'Zoom' },
+           label: 'Zoom',
+           keys: ['z'],
+           isEditable: true,
+         },
+       ],
+     },
+   });
```

#### b. Add new hotkeys using `$push`:

```diff
+ onModeEnter: function ({ servicesManager }) {
+   const { customizationService } = servicesManager.services;
+   customizationService.setCustomizations({
+     'ohif.hotkeyBindings': {
+       $push: [
+         {
+           commandName: 'myCustomCommand',
+           label: 'My Custom Function',
+           keys: ['ctrl+m'],
+           isEditable: true,
+         },
+       ],
+     },
+   });
+}
```

### 4. Update configuration file if you were setting window.config.hotkeys

If you were previously defining hotkeys in your window.config.js file, it was not really
taken into account. So you can safely remove it now.

**Before:**
```diff
- window.config = {
-   // ...other config
-   hotkeys: [
-     {
-       commandName: 'incrementActiveViewport',
-       label: 'Next Viewport',
-       keys: ['right'],
-     },
-     // ...more hotkeys
-   ],
- };
```

**After:**
```diff
+ window.config = {
+   // ...other config
+ };
```

### 5. Be aware that user preferences are now handled differently

The new system automatically handles user-preferred hotkey mappings:

- User hotkey preferences are stored in `localStorage` under the key `user-preferred-keys`
- The format is a hash-based mapping rather than a full array of definitions
- There's a migration utility that converts old preferences to the new format
- You don't need to manually handle this, but be aware of it if you're accessing localStorage directly


## Benefits of the Change

1. **Consistent API**: Hotkeys now follow the same customization pattern as other OHIF features
2. **More flexible**: Easier to modify specific hotkeys without replacing the entire set
3. **Better user preferences**: User customizations are better preserved and migrated
4. **Runtime updates**: Hotkeys can be modified at runtime through the customization service
5. **Improved cleanup**: Better lifecycle management of hotkey bindings
