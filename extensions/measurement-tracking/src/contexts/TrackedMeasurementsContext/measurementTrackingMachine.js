import { assign } from 'xstate';

const RESPONSE = {
  NO_NEVER: -1,
  CANCEL: 0,
  CREATE_REPORT: 1,
  ADD_SERIES: 2,
  SET_STUDY_AND_SERIES: 3,
};

const machineConfiguration = {
  id: 'measurementTracking',
  initial: 'idle',
  context: {
    trackedStudy: '',
    trackedSeries: [],
  },
  states: {
    off: {
      type: 'final',
    },
    idle: {
      entry: 'clearContext',
      on: {
        TRACK_SERIES: 'promptBeginTracking',
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
      },
    },
    promptTrackNewSeries: {
      invoke: {
        src: 'promptTrackNewSeries',
        onDone: [
          {
            target: 'tracking',
            actions: ['addTrackedSeries'],
            cond: 'shouldAddSeries',
          },
          {
            target: 'tracking',
            actions: ['setTrackedStudyAndSeries'],
            cond: 'shouldSetStudyAndSeries',
          },
          // CREATE_REPORT && CANCEL
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
            actions: ['setTrackedStudyAndSeries'],
            cond: 'shouldSetStudyAndSeries',
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
    clearContext: assign({
      trackedStudy: '',
      trackedSeries: [],
    }),
    // Promise resolves w/ `evt.data.*`
    setTrackedStudyAndSeries: assign((ctx, evt) => ({
      trackedStudy: evt.data.StudyInstanceUID,
      trackedSeries: [evt.data.SeriesInstanceUID],
    })),
    addTrackedSeries: assign((ctx, evt) => ({
      trackedSeries: [...ctx.trackedSeries, evt.data.SeriesInstanceUID],
    })),
    removeTrackedSeries: assign((ctx, evt) => ({
      trackedSeries: ctx.trackedSeries
        .slice()
        .filter(ser => ser !== evt.SeriesInstanceUID),
    })),
  },
  guards: {
    shouldKillMachine: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.NO_NEVER,
    shouldAddSeries: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.ADD_SERIES,
    shouldSetStudyAndSeries: (ctx, evt) =>
      evt.data && evt.data.userResponse === RESPONSE.SET_STUDY_AND_SERIES,
    // Has more than 1, or SeriesInstanceUID is not in list
    // --> Post removal would have non-empty trackedSeries array
    hasRemainingTrackedSeries: (ctx, evt) =>
      ctx.trackedSeries.length > 1 ||
      !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
    isNewStudy: (ctx, evt) => ctx.trackedStudy !== evt.StudyInstanceUID,
    isNewSeries: (ctx, evt) =>
      !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
  },
};

export { defaultOptions, machineConfiguration };
