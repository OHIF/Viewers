import { assign } from 'xstate';

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
            cond: 'promptAccepted',
          },
          {
            target: 'off',
            cond: 'promptDeclined',
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
    promptTrackNewStudy: {
      invoke: {
        src: 'promptTrackNewStudy',
        onDone: [
          {
            target: 'tracking',
            actions: ['setTrackedStudyAndSeries'],
            cond: 'promptAccepted',
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
    promptTrackNewSeries: {
      invoke: {
        src: 'promptTrackNewSeries',
        onDone: [
          {
            target: 'tracking',
            actions: ['addTrackedSeries'],
            cond: 'promptAccepted',
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
      trackedSeries: [
        ...ctx.trackedSeries(ser => ser !== evt.SeriesInstanceUID),
      ],
    })),
  },
  guards: {
    promptAccepted: (ctx, evt) => evt.data && evt.data.userResponse === 1,
    promptCanceled: (ctx, evt) => evt.data && evt.data.userResponse === 0,
    promptDeclined: (ctx, evt) => evt.data && evt.data.userResponse === -1,
    hasRemainingTrackedSeries: (ctx, evt) =>
      ctx.trackedSeries.length === 1 &&
      ctx.trackedSeries.includes(evt.SeriesInstanceUID),
    isNewStudy: (ctx, evt) => ctx.trackedStudy !== evt.StudyInstanceUID,
    isNewSeries: (ctx, evt) =>
      !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
  },
};

// const measurementTrackingMachine = Machine(
//   machineConfiguration,
//   defaultOptions
// );
// .transition(state, eventArgument).value
// const service = interpret(measurementTrackingMachine).start();
// .send(event): nextState
// .state (getter)
// .onTransition(state => { state.vale })
export { defaultOptions, machineConfiguration };
