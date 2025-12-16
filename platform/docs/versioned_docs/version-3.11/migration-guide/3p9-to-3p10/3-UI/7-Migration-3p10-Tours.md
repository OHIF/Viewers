---
title: Tours and Onboarding
summary: Migration guide for Tours and Onboarding features in OHIF 3.10, explaining the transition from defining tours directly in window.config.tours to using the customization service, enabling mode-specific tours and better organization.
---

## Migration Guide: Tours

* Tours are no longer defined directly in `window.config.tours` but through the customization service under the key `ohif.tours`
* The `waitForElement` utility function has been moved from the config file to a dedicated customization file
* The structure of tour definitions (steps, options, etc.) remains largely the same

## Migration Steps:



### 1. Update any direct references to window.config.tours

If you have any code that directly references window.config.tours, update it to use the customization service:

```diff
- const tours = window.config.tours;
+ const tours = customizationService.getCustomization('ohif.tours');
```

### 2. Use config update patterns for configuring tours

**Before:**
```diff
- window.config = {
-   tours: [
-     {
-       id: 'basicViewerTour',
-       route: '/viewer',
-       steps: [
-         // tour steps...
-       ],
-       tourOptions: {
-         // tour options...
-       },
-     },
-   ],
- };
```

**After:**
```javascript
window.config = {
  customizationService: {
    'ohif.tours': {
      $set: [
        {
          id: 'basicViewerTour',
          route: '/viewer',
          steps: [
            // Your tour steps
          ],
        },
      ],
    },
  },
};
```


## Benefits of the Change

4. **Mode-specific Tours**: now you can have different tours for different modes
