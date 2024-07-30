import { hydrateStructuredReport } from '@ohif/extension-cornerstone-dicom-sr';
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
    activeViewportId: null,
    trackedStudy: '',
    trackedSeries: [],
    ignoredSeries: [],
    //
    prevTrackedStudy: '',
    prevTrackedSeries: [],
    prevIgnoredSeries: [],
    //
    ignoredSRSeriesForHydration: [],
    isDirty: false,
  },
  states: {
    off: {
      type: 'final',
    },
    labellingOnly: {
      on: {
        TRACK_SERIES: [
          {
            target: 'promptLabelAnnotation',
            actions: ['setPreviousState'],
          },
          {
            target: 'off',
          },
        ],
      },
    },
    idle: {
      entry: 'clearContext',
      on: {
        TRACK_SERIES: [
          {
            target: 'promptLabelAnnotation',
            cond: 'isLabelOnMeasure',
            actions: ['setPreviousState'],
          },
          {
            target: 'promptBeginTracking',
            actions: ['setPreviousState'],
          },
        ],
        // Unused? We may only do PROMPT_HYDRATE_SR now?
        SET_TRACKED_SERIES: [
          {
            target: 'tracking',
            actions: ['setTrackedStudyAndMultipleSeries', 'setIsDirtyToClean'],
          },
        ],
        PROMPT_HYDRATE_SR: {
          target: 'promptHydrateStructuredReport',
          cond: 'hasNotIgnoredSRSeriesForHydration',
        },
        RESTORE_PROMPT_HYDRATE_SR: 'promptHydrateStructuredReport',
        HYDRATE_SR: 'hydrateStructuredReport',
        UPDATE_ACTIVE_VIEWPORT_ID: {
          actions: assign({
            activeViewportId: (_, event) => event.activeViewportId,
          }),
        },
      },
    },
    promptBeginTracking: {
      invoke: {
        src: 'promptBeginTracking',
        onDone: [
          {
            target: 'tracking',
            actions: ['setTrackedStudyAndSeries', 'setIsDirty'],
            cond: 'shouldSetStudyAndSeries',
          },
          {
            target: 'labellingOnly',
            cond: 'isLabelOnMeasureAndShouldKillMachine',
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
            target: 'promptLabelAnnotation',
            cond: 'isLabelOnMeasure',
            actions: ['setPreviousState'],
          },
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
            actions: ['removeTrackedSeries', 'setIsDirty'],
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
            actions: ['clearAllMeasurements', 'showStructuredReportDisplaySetInActiveViewport'],
            cond: 'shouldSaveAndContinueWithSameReport',
          },
          // "starting a new report"
          // - remove "just saved" measurements
          // - start tracking a new study + report
          {
            target: 'tracking',
            actions: ['discardPreviouslyTrackedMeasurements', 'setTrackedStudyAndSeries'],
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
              'jumpToSameImageInActiveViewport',
              'setIsDirtyToClean',
            ],
            cond: 'shouldHydrateStructuredReport',
          },
          {
            target: 'idle',
            actions: ['ignoreHydrationForSRSeries'],
            cond: 'shouldIgnoreHydrationForSR',
          },
        ],
        onError: {
          target: 'idle',
        },
      },
    },
    hydrateStructuredReport: {
      invoke: {
        src: 'hydrateStructuredReport',
        onDone: [
          {
            target: 'tracking',
            actions: [
              'setTrackedStudyAndMultipleSeries',
              'jumpToSameImageInActiveViewport',
              'setIsDirtyToClean',
            ],
          },
        ],
        onError: {
          target: 'idle',
        },
      },
    },
    promptLabelAnnotation: {
      invoke: {
        src: 'promptLabelAnnotation',
        onDone: [
          {
            target: 'labellingOnly',
            cond: 'wasLabellingOnly',
          },
          {
            target: 'promptBeginTracking',
            cond: 'wasIdle',
          },
          {
            target: 'promptTrackNewStudy',
            cond: 'wasTrackingAndIsNewStudy',
          },
          {
            target: 'promptTrackNewSeries',
            cond: 'wasTrackingAndIsNewSeries',
          },
          {
            target: 'tracking',
            cond: 'wasTracking',
          },
          {
            target: 'off',
          },
        ],
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
    jumpToFirstMeasurementInActiveViewport: (ctx, evt) => {
      console.warn('jumpToFirstMeasurementInActiveViewport: not implemented');
    },
    showStructuredReportDisplaySetInActiveViewport: (ctx, evt) => {
      console.warn('showStructuredReportDisplaySetInActiveViewport: not implemented');
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
      const studyInstanceUID = evt.StudyInstanceUID || evt.data.StudyInstanceUID;
      const seriesInstanceUIDs = evt.SeriesInstanceUIDs || evt.data.SeriesInstanceUIDs;

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
    setIsDirty: assign((ctx, evt) => ({
      isDirty: true,
    })),
    ignoreSeries: assign((ctx, evt) => ({
      prevIgnoredSeries: [...ctx.ignoredSeries],
      ignoredSeries: [...ctx.ignoredSeries, evt.data.SeriesInstanceUID],
    })),
    ignoreHydrationForSRSeries: assign((ctx, evt) => ({
      ignoredSRSeriesForHydration: [
        ...ctx.ignoredSRSeriesForHydration,
        evt.data.srSeriesInstanceUID,
      ],
    })),
    addTrackedSeries: assign((ctx, evt) => ({
      prevTrackedSeries: [...ctx.trackedSeries],
      trackedSeries: [...ctx.trackedSeries, evt.data.SeriesInstanceUID],
    })),
    removeTrackedSeries: assign((ctx, evt) => ({
      prevTrackedSeries: ctx.trackedSeries.slice().filter(ser => ser !== evt.SeriesInstanceUID),
      trackedSeries: ctx.trackedSeries.slice().filter(ser => ser !== evt.SeriesInstanceUID),
    })),
    setPreviousState: assign((ctx, evt, meta) => {
      return {
        prevState: meta.state.value,
      };
    }),
  },
  guards: {
    // We set dirty any time we performan an action that:
    // - Tracks a new study
    // - Tracks a new series
    // - Adds a measurement to an already tracked study/series
    //
    // We set clean any time we restore from an SR
    //
    // This guard/condition is specific to "new measurements"
    // to make sure we only track dirty when the new measurement is specific
    // to a series we're already tracking
    //
    // tl;dr
    // Any report change, that is not a hydration of an existing report, should
    // result in a "dirty" report
    //
    // Where dirty means there would be "loss of data" if we blew away measurements
    // without creating a new SR.
    shouldSetDirty: (ctx, evt) => {
      return (
        // When would this happen?
        evt.SeriesInstanceUID === undefined || ctx.trackedSeries.includes(evt.SeriesInstanceUID)
      );
    },
    wasLabellingOnly: (ctx, evt, condMeta) => {
      return ctx.prevState === 'labellingOnly';
    },
    wasIdle: (ctx, evt, condMeta) => {
      return ctx.prevState === 'idle';
    },
    wasTracking: (ctx, evt, condMeta) => {
      return ctx.prevState === 'tracking';
    },
    wasTrackingAndIsNewStudy: (ctx, evt, condMeta) => {
      return (
        ctx.prevState === 'tracking' &&
        !ctx.ignoredSeries.includes(evt.data.SeriesInstanceUID) &&
        ctx.trackedStudy !== evt.data.StudyInstanceUID
      );
    },
    wasTrackingAndIsNewSeries: (ctx, evt, condMeta) => {
      return (
        ctx.prevState === 'tracking' &&
        !ctx.ignoredSeries.includes(evt.data.SeriesInstanceUID) &&
        !ctx.trackedSeries.includes(evt.data.SeriesInstanceUID)
      );
    },

    shouldKillMachine: (ctx, evt) => evt.data && evt.data.userResponse === RESPONSE.NO_NEVER,
    shouldAddSeries: (ctx, evt) => evt.data && evt.data.userResponse === RESPONSE.ADD_SERIES,
    shouldSetStudyAndSeries: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.SET_STUDY_AND_SERIES,
    shouldAddIgnoredSeries: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.NO_NOT_FOR_SERIES,
    shouldPromptSaveReport: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.CREATE_REPORT,
    shouldIgnoreHydrationForSR: (ctx, evt) => evt.data && evt.data.userResponse === RESPONSE.CANCEL,
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
      ctx.trackedSeries.length > 1 || !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
    hasNotIgnoredSRSeriesForHydration: (ctx, evt) => {
      return !ctx.ignoredSRSeriesForHydration.includes(evt.SeriesInstanceUID);
    },
    isNewStudy: (ctx, evt) =>
      !ctx.ignoredSeries.includes(evt.SeriesInstanceUID) &&
      ctx.trackedStudy !== evt.StudyInstanceUID,
    isNewSeries: (ctx, evt) =>
      !ctx.ignoredSeries.includes(evt.SeriesInstanceUID) &&
      !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
  },
};

export { defaultOptions, machineConfiguration, RESPONSE };
