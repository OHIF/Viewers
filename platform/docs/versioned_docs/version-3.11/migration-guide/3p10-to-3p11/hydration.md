---
title: Hydration
sidebar_position: 3
sidebar_label: Hydration
summary: Migration guide for OHIF 3.11's hydration system changes, including the transition to a centralized hydration dialog and command-based hydration for secondary display sets.
---

## Update Hydration Logic:
    *   The `promptHydrateSEG` and `promptHydrateRT` functions have been updated to use the generic `utils.promptHydrationDialog` from `@ohif/extension-cornerstone`.
    *   The actual hydration is now often triggered by the `hydrateSecondaryDisplaySet` command.

    *Example: `promptHydrateRT` change*

    ```diff
    // extensions/cornerstone-dicom-rt/src/utils/promptHydrateRT.ts
    - const RESPONSE = {
    -   NO_NEVER: -1,
    -   CANCEL: 0,
    -   HYDRATE_SEG: 5,
    - };
    + import { utils, Types } from '@ohif/extension-cornerstone';

    function promptHydrateRT({
      servicesManager,
      rtDisplaySet,
      viewportId,
      preHydrateCallbacks,
      hydrateRTDisplaySet,
    -}: withAppTypes) {
    -  const { uiViewportDialogService, customizationService } = servicesManager.services;
    -  // ... lots of old promise and dialog logic
    -  return new Promise(async function (resolve, reject) {
    -    // ...
    -  });
    -}
    -
    -function _askHydrate(
    -  // ...
    -) {
    -  // ...
    -}
    +}: {
    +  servicesManager: AppTypes.ServicesManager;
    +  rtDisplaySet: AppTypes.DisplaySet;
    +  viewportId: string;
    +  preHydrateCallbacks?: Types.HydrationCallback[];
    +  hydrateRTDisplaySet: Types.HydrationCallback;
    +}) {
    +  return utils.promptHydrationDialog({
    +    servicesManager,
    +    viewportId,
    +    displaySet: rtDisplaySet,
    +    preHydrateCallbacks,
    +    hydrateCallback: hydrateRTDisplaySet,
    +    type: 'RTSTRUCT',
    +  });
    }
    ```
    The `hydrateRTDisplaySet` callback passed to this function would now typically involve the `hydrateSecondaryDisplaySet` command.
    ```diff
    // extensions/cornerstone-dicom-rt/src/viewports/OHIFCornerstoneRTViewport.tsx
    useEffect(() => {
      if (rtIsLoading) {
        return;
      }
      promptHydrateRT({
        servicesManager,
        viewportId,
        rtDisplaySet,
    -      preHydrateCallbacks: [storePresentationState],
    -      hydrateRTDisplaySet,
    -    }).then(isHydrated => {
    -      if (isHydrated) {
    -        setIsHydrated(true);
    -      }
    +      hydrateRTDisplaySet: async () => {
    +        return commandsManager.runCommand('hydrateSecondaryDisplaySet', {
    +          displaySet: rtDisplaySet,
    +          viewportId,
    +        });
    +      },
      });
    -  }, [servicesManager, viewportId, rtDisplaySet, rtIsLoading]);
    +  }, [servicesManager, viewportId, rtDisplaySet, rtIsLoading, commandsManager]);
    ```
