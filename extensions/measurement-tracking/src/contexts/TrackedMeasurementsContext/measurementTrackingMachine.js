import { assign } from 'xstate';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
  NO_NOT_FOR_SERIES: 4,
  HYDRATE_REPORT: 5,
};

const machineConfiguration = {
  id: 'measurementTracking',
  initial: 'idle',
  context: {
    trackedStudy: '',
    trackedSeries: [],
    ignoredSeries: [],
    //
    prevTrackedStudy: '',
    prevTrackedSeries: [],
    prevIgnoredSeries: [],
    //
    isDirty: false,
  },
  states: {
    off: {
      type: 'final',
    },
    idle: {
      entry: 'clearContext',
      on: {
        TRACK_SERIES: 'promptBeginTracking',
        SET_TRACKED_SERIES: [
          {
            target: 'tracking',
            actions: ['setTrackedStudyAndMultipleSeries', 'setIsDirtyToClean'],
          },
        ],
        PROMPT_HYDRATE_SR: 'promptHydrateStructuredReport',
      },
    },
    promptBeginTracking: {
      invoke: {
        src: 'promptBeginTracking',
        onDone: [
          {
            target: 'tracking',
            actions: ['setTrackedStudyAndSeries'],
            cond: 'shouldSetStudyAndSeries',
          },
          {
            target: 'off',
            cond: 'shouldKillMachine',
          },
          {
            target: 'idle',
          },
        ],
        onError: {
          target: 'idle',
        },
      },
    },
    tracking: {
      on: {
        TRACK_SERIES: [
          {
            target: 'promptTrackNewStudy',
            cond: 'isNewStudy',
          },
          {
            target: 'promptTrackNewSeries',
            cond: 'isNewSeries',
          },
        ],
        UNTRACK_SERIES: [
          {
            target: 'tracking',
            actions: ['removeTrackedSeries'],
            cond: 'hasRemainingTrackedSeries',
          },
          {
            target: 'idle',
          },
        ],
        SET_TRACKED_SERIES: [
          {
            target: 'tracking',
            actions: ['setTrackedStudyAndMultipleSeries'],
          },
        ],
        SAVE_REPORT: 'promptSaveReport',
        SET_DIRTY: [
          {
            target: 'tracking',
            actions: ['setIsDirty'],
            cond: 'shouldSetDirty',
          },
          {
            target: 'tracking',
          },
        ],
      },
    },
    promptTrackNewSeries: {
      invoke: {
        src: 'promptTrackNewSeries',
        onDone: [
          {
            target: 'tracking',
            actions: ['addTrackedSeries', 'setIsDirty'],
            cond: 'shouldAddSeries',
          },
          {
            target: 'tracking',
            actions: [
              'discardPreviouslyTrackedMeasurements',
              'setTrackedStudyAndSeries',
              'setIsDirty',
            ],
            cond: 'shouldSetStudyAndSeries',
          },
          {
            target: 'promptSaveReport',
            cond: 'shouldPromptSaveReport',
          },
          {
            target: 'tracking',
          },
        ],
        onError: {
          target: 'idle',
        },
      },
    },
    promptTrackNewStudy: {
      invoke: {
        src: 'promptTrackNewStudy',
        onDone: [
          {
            target: 'tracking',
            actions: [
              'discardPreviouslyTrackedMeasurements',
              'setTrackedStudyAndSeries',
              'setIsDirty',
            ],
            cond: 'shouldSetStudyAndSeries',
          },
          {
            target: 'tracking',
            actions: ['ignoreSeries'],
            cond: 'shouldAddIgnoredSeries',
          },
          {
            target: 'promptSaveReport',
            cond: 'shouldPromptSaveReport',
          },
          {
            target: 'tracking',
          },
        ],
        onError: {
          target: 'idle',
        },
      },
    },
    promptSaveReport: {
      invoke: {
        src: 'promptSaveReport',
        onDone: [
          // "clicked the save button"
          // - should clear all measurements
          // - show DICOM SR
          {
            target: 'idle',
            actions: [
              'clearAllMeasurements',
              'showStructuredReportDisplaySetInActiveViewport',
            ],
            cond: 'shouldSaveAndContinueWithSameReport',
          },
          // "starting a new report"
          // - remove "just saved" measurements
          // - start tracking a new study + report
          {
            target: 'tracking',
            actions: [
              'discardPreviouslyTrackedMeasurements',
              'setTrackedStudyAndSeries',
            ],
            cond: 'shouldSaveAndStartNewReport',
          },
          // Cancel, back to tracking
          {
            target: 'tracking',
          },
        ],
        onError: {
          target: 'idle',
        },
      },
    },
    promptHydrateStructuredReport: {
      invoke: {
        src: 'promptHydrateStructuredReport',
        onDone: [
          {
            target: 'tracking',
            actions: [
              'setTrackedStudyAndMultipleSeries',
              'showSeriesInActiveViewport',
              'setIsDirtyToClean',
            ],
            cond: 'shouldHydrateStructuredReport',
          },
          {
            target: 'idle',
          },
        ],
        onError: {
          target: 'idle',
        },
      },
    },
  },
  strict: true,
};

const defaultOptions = {
  services: {
    promptBeginTracking: (ctx, evt) => {
      // return { userResponse, StudyInstanceUID, SeriesInstanceUID }
    },
    promptTrackNewStudy: (ctx, evt) => {
      // return { userResponse, StudyInstanceUID, SeriesInstanceUID }
    },
    promptTrackNewSeries: (ctx, evt) => {
      // return { userResponse, StudyInstanceUID, SeriesInstanceUID }
    },
  },
  actions: {
    discardPreviouslyTrackedMeasurements: (ctx, evt) => {
      console.log('discardPreviouslyTrackedMeasurements: not implemented');
    },
    clearAllMeasurements: (ctx, evt) => {
      console.log('clearAllMeasurements: not implemented');
    },
    showSeriesInActiveViewport: (ctx, evt) => {
      console.warn('showSeriesInActiveViewport: not implemented');
    },
    showStructuredReportDisplaySetInActiveViewport: (ctx, evt) => {
      console.warn(
        'showStructuredReportDisplaySetInActiveViewport: not implemented'
      );
    },
    clearContext: assign({
      trackedStudy: '',
      trackedSeries: [],
      ignoredSeries: [],
      prevTrackedStudy: '',
      prevTrackedSeries: [],
      prevIgnoredSeries: [],
    }),
    // Promise resolves w/ `evt.data.*`
    setTrackedStudyAndSeries: assign((ctx, evt) => ({
      prevTrackedStudy: ctx.trackedStudy,
      prevTrackedSeries: ctx.trackedSeries.slice(),
      prevIgnoredSeries: ctx.ignoredSeries.slice(),
      //
      trackedStudy: evt.data.StudyInstanceUID,
      trackedSeries: [evt.data.SeriesInstanceUID],
      ignoredSeries: [],
    })),
    setTrackedStudyAndMultipleSeries: assign((ctx, evt) => {
      const studyInstanceUID =
        evt.StudyInstanceUID || evt.data.StudyInstanceUID;
      const seriesInstanceUIDs =
        evt.SeriesInstanceUIDs || evt.data.SeriesInstanceUIDs;

      return {
        prevTrackedStudy: ctx.trackedStudy,
        prevTrackedSeries: ctx.trackedSeries.slice(),
        prevIgnoredSeries: ctx.ignoredSeries.slice(),
        //
        trackedStudy: studyInstanceUID,
        trackedSeries: [...ctx.trackedSeries, ...seriesInstanceUIDs],
        ignoredSeries: [],
      };
    }),
    setIsDirtyToClean: assign((ctx, evt) => ({
      isDirty: false,
    })),
    setIsDirty: assign((ctx, evt) => {
      debugger;
      return {
        isDirty: true,
      };
    }),
    ignoreSeries: assign((ctx, evt) => ({
      prevIgnoredSeries: [...ctx.ignoredSeries],
      ignoredSeries: [...ctx.ignoredSeries, evt.data.SeriesInstanceUID],
    })),
    addTrackedSeries: assign((ctx, evt) => ({
      prevTrackedSeries: [...ctx.trackedSeries],
      trackedSeries: [...ctx.trackedSeries, evt.data.SeriesInstanceUID],
    })),
    removeTrackedSeries: assign((ctx, evt) => ({
      prevTrackedSeries: ctx.trackedSeries
        .slice()
        .filter(ser => ser !== evt.SeriesInstanceUID),
      trackedSeries: ctx.trackedSeries
        .slice()
        .filter(ser => ser !== evt.SeriesInstanceUID),
    })),
  },
  guards: {
    shouldSetDirty: (ctx, evt) => {
      // 1. We need to flip this _after_ tracking a new measurement,
      //    but mark "clean" after save, and after restore
      //
      //    This is tricky, because the measurement service isn't notified
      //    of new tracks to _existing_ measurements
      //
      //    So... We need to set this dirty after any new measurement to a tracked
      //    viewport (see SET_DIRTY transition) and any tracking event not inspired
      //    by the SR restore (now that we don't clear + restore after save)
      console.warn('SHOULD SET DIRTY?', evt);
      // debugger;
      return (
        // When would this happen?
        evt.SeriesInstanceUID === undefined ||
        // Why wouldn't we care about measurements with the same series id?
        !ctx.trackedSeries.includes(evt.SeriesInstanceUID)
      );
    },
    shouldKillMachine: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.NO_NEVER,
    shouldAddSeries: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.ADD_SERIES,
    shouldSetStudyAndSeries: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.SET_STUDY_AND_SERIES,
    shouldAddIgnoredSeries: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.NO_NOT_FOR_SERIES,
    shouldPromptSaveReport: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.CREATE_REPORT,
    shouldSaveAndContinueWithSameReport: (ctx, evt) =>
      evt.data &&
      evt.data.userResponse === RESPONSE.CREATE_REPORT &&
      evt.data.isBackupSave === true,
    shouldSaveAndStartNewReport: (ctx, evt) =>
      evt.data &&
      evt.data.userResponse === RESPONSE.CREATE_REPORT &&
      evt.data.isBackupSave === false,
    shouldHydrateStructuredReport: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.HYDRATE_REPORT,
    // Has more than 1, or SeriesInstanceUID is not in list
    // --> Post removal would have non-empty trackedSeries array
    hasRemainingTrackedSeries: (ctx, evt) =>
      ctx.trackedSeries.length > 1 ||
      !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
    isNewStudy: (ctx, evt) =>
      !ctx.ignoredSeries.includes(evt.SeriesInstanceUID) &&
      ctx.trackedStudy !== evt.StudyInstanceUID,
    isNewSeries: (ctx, evt) =>
      !ctx.ignoredSeries.includes(evt.SeriesInstanceUID) &&
      !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
  },
};

export { defaultOptions, machineConfiguration };
