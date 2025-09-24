export type HydrationCallback = (params: any) => Promise<boolean>;

export const HydrationType = {
  SEG: 'SEG',
  SR: 'SR',
  RTSTRUCT: 'RTSTRUCT',
} as const;

export interface HydrationDialogProps {
  servicesManager: AppTypes.ServicesManager;
  viewportId: string;
  displaySet: AppTypes.DisplaySet;
  preHydrateCallbacks?: HydrationCallback[];
  hydrateCallback: HydrationCallback;
  type: string;
}

export interface HydrationSRResult {
  userResponse: number;
  displaySetInstanceUID: string;
  srSeriesInstanceUID: string;
  viewportId: string;
  StudyInstanceUID?: string;
  SeriesInstanceUIDs?: string[];
}

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
  HYDRATE: 5,
};

function getCustomizationMessageKey(type: string): string {
  switch (type) {
    case HydrationType.RTSTRUCT:
      return 'viewportNotification.hydrateRTMessage';
    case HydrationType.SEG:
      return 'viewportNotification.hydrateSEGMessage';
    case HydrationType.SR:
      return 'viewportNotification.hydrateSRMessage';
    default:
      return 'viewportNotification.hydrateMessage';
  }
}

function getDialogId(type: string): string {
  switch (type) {
    case HydrationType.RTSS:
      return 'promptHydrateRT';
    case HydrationType.SEG:
      return 'promptHydrateSEG';
    case HydrationType.SR:
      return 'promptHydrateSR';
    default:
      return 'promptHydrate';
  }
}

function promptHydrationDialog({
  servicesManager,
  viewportId,
  displaySet,
  preHydrateCallbacks = [],
  hydrateCallback,
  type,
}: HydrationDialogProps): Promise<boolean | HydrationSRResult> {
  const { uiViewportDialogService, customizationService } = servicesManager.services;
  const extensionManager = servicesManager._extensionManager;
  const appConfig = extensionManager._appConfig;

  // Todo: make this use enum from the extension, we should move the enum
  const standardMode = appConfig?.measurementTrackingMode === 'standard';

  return new Promise(async function (resolve, reject) {
    // For RT and SEG, we check disableConfirmationPrompts
    // For SR, we check if standardMode is true
    const shouldPrompt =
      type === HydrationType.SR ? standardMode : !appConfig?.disableConfirmationPrompts;

    const promptResult = shouldPrompt
      ? await _askHydrate(uiViewportDialogService, customizationService, viewportId, type)
      : RESPONSE.HYDRATE;

    if (promptResult === RESPONSE.HYDRATE) {
      // Execute preHydrate callbacks
      preHydrateCallbacks?.forEach(callback => {
        callback();
      });

      if (type === HydrationType.SEG) {
        // SEG needs setTimeout
        window.setTimeout(async () => {
          const isHydrated = await hydrateCallback({
            segDisplaySet: displaySet,
            viewportId,
          });

          resolve(isHydrated);
        }, 0);
      } else if (type === HydrationType.RTSTRUCT) {
        // RT hydration
        const isHydrated = await hydrateCallback({
          rtDisplaySet: displaySet,
          viewportId,
          servicesManager,
        });

        resolve(isHydrated);
      } else if (type === HydrationType.SR) {
        // SR has a different result structure
        const hydrationResult = await hydrateCallback(displaySet);

        resolve({
          userResponse: promptResult,
          displaySetInstanceUID: displaySet.displaySetInstanceUID,
          srSeriesInstanceUID: displaySet.SeriesInstanceUID,
          viewportId,
          StudyInstanceUID: hydrationResult?.StudyInstanceUID,
          SeriesInstanceUIDs: hydrationResult?.SeriesInstanceUIDs,
        });
      }
    } else {
      if (type === HydrationType.SR) {
        resolve({
          userResponse: promptResult,
          displaySetInstanceUID: displaySet.displaySetInstanceUID,
          srSeriesInstanceUID: displaySet.SeriesInstanceUID,
          viewportId,
        });
      } else {
        resolve(false);
      }
    }
  });
}

function _askHydrate(
  uiViewportDialogService: AppTypes.UIViewportDialogService,
  customizationService: AppTypes.CustomizationService,
  viewportId: string,
  type: string
) {
  return new Promise(function (resolve, reject) {
    const messageKey = getCustomizationMessageKey(type);
    const message = customizationService.getCustomization(messageKey);
    const actions = [
      {
        id: 'no-hydrate',
        type: 'secondary',
        text: 'No',
        value: RESPONSE.CANCEL,
      },
      {
        id: 'yes-hydrate',
        type: 'primary',
        text: 'Yes',
        value: RESPONSE.HYDRATE,
      },
    ];
    const onSubmit = result => {
      uiViewportDialogService.hide();
      resolve(result);
    };

    uiViewportDialogService.show({
      id: getDialogId(type),
      viewportId,
      type: 'info',
      message,
      actions,
      onSubmit,
      onOutsideClick: () => {
        uiViewportDialogService.hide();
        resolve(RESPONSE.CANCEL);
      },
      onKeyPress: event => {
        if (event.key === 'Enter') {
          onSubmit(RESPONSE.HYDRATE);
        }
      },
    });
  });
}

export default promptHydrationDialog;
