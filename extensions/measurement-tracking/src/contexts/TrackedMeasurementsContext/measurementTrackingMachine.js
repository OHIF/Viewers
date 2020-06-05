import { Machine, assign } from 'xstate';
// import { assign } from '@xstate/immer';

const machineConfiguration = {
  id: 'measurementTracking',
  initial: 'notTracking',
  context: {
    prevTrackedStudy: '',
    prevTrackedSeries: [],
    trackedStudy: '',
    trackedSeries: [],
    promptResponse: 0,
  },
  states: {
    notTracking: {
      entry: 'clearContext',
      on: {
        TRACK_SERIES: {
          target: 'awaitShouldTrackPrompt',
          actions: 'trackSeries',
        },
      },
    },
    awaitShouldTrackPrompt: {
      initial: 'prompt',
      states: {
        prompt: {
          invoke: {
            id: 'shouldTrackPrompt',
            src: 'shouldTrackPrompt',
            onDone: {
              target: 'validateResponse',
              actions: assign({ promptResponse: (ctx, evt) => evt.data }),
            },
            onError: {
              target: 'validateResponse',
              actions: assign({ promptResponse: (ctx, evt) => evt.data }),
            },
          },
        },
        validateResponse: {
          on: {
            '': [
              {
                target: '#measurementTracking.tracking',
                cond: 'acceptResponse',
              },
              {
                target: '#measurementTracking.neverTrack',
                cond: 'rejectResponse',
              },
              {
                target: '#measurementTracking.notTracking',
                cond: 'cancelResponse',
              },
            ],
          },
        },
      },
    },
    neverTrack: {
      type: 'final',
    },
    tracking: {
      on: {
        TRACK_SERIES: [
          {
            target: 'tracking',
            cond: 'hasNewSeriesForTrackedStudy',
            actions: 'trackSeries',
          },
          {
            target: 'awaitShouldTrackNewStudyPrompt',
            cond: 'willTrackNewStudy',
            actions: ['setPrevTracked', 'clearTrackedSeries', 'trackSeries'],
          },
        ],
        UNTRACK_SERIES: [
          {
            target: 'notTracking',
            cond: 'willBeEmpty',
            actions: 'untrackSeries',
          },
          {
            target: 'tracking',
            actions: 'untrackSeries',
          },
        ],
      },
    },
    awaitShouldTrackNewStudyPrompt: {
      initial: 'prompt',
      states: {
        prompt: {
          invoke: {
            id: 'shouldTrackPrompt',
            src: () => confirmDialog('Should we track new study?'),
            onDone: {
              target: 'validateResponse',
              actions: assign({ promptResponse: (ctx, evt) => evt.data }),
            },
            onError: {
              target: 'validateResponse',
              actions: assign({ promptResponse: (ctx, evt) => evt.data }),
            },
          },
        },
        validateResponse: {
          on: {
            '': [
              {
                target: '#measurementTracking.tracking',
                cond: 'acceptResponse',
              },
              {
                target: '#measurementTracking.tracking',
                cond: 'rejectResponse',
                actions: 'restorePrevTracked',
              },
            ],
          },
        },
      },
    },
  },
  strict: true,
};

function confirmDialog(msg) {
  return new Promise(function(resolve, reject) {
    let confirmed = window.confirm(msg);

    return confirmed ? resolve(1) : reject(-1);
  });
}

const defaultOptions = {
  services: {
    shouldTrackPrompt: () => {
      return confirmDialog('Should we start tracking?');
    },
  },
  actions: {
    clearContext: assign({
      prevTrackedStudy: '',
      prevTrackedSeries: [],
      trackedStudy: '',
      trackedSeries: [],
      promptResponse: 0,
    }),
    setPrevTracked: assign(ctx => ({
      prevTrackedStudy: ctx.trackedStudy,
      prevTrackedSeries: ctx.trackedSeries.slice(),
    })),
    restorePrevTracked: assign(ctx => ({
      trackedStudy: ctx.prevTrackedStudy,
      trackedSeries: ctx.prevTrackedSeries.slice(),
    })),
    clearTrackedSeries: assign(() => ({
      trackedStudy: '',
      trackedSeries: [],
    })),
    trackSeries: assign((ctx, evt) => {
      const prevTrackedSeries = ctx.trackedSeries.slice();
      return {
        trackedStudy: evt.StudyInstanceUID || '',
        trackedSeries: [...prevTrackedSeries, evt.SeriesInstanceUID],
      };
    }),
    untrackSeries: assign((ctx, evt) => {
      const prevTrackedSeries = ctx.trackedSeries.slice();
      return {
        trackedSeries: prevTrackedSeries.filter(
          serUid => serUid !== evt.SeriesInstanceUID
        ),
      };
    }),
  },
  guards: {
    hasNewSeriesForTrackedStudy: (ctx, evt) =>
      evt.StudyInstanceUID === ctx.trackedStudy &&
      !ctx.trackedSeries.includes(evt.SeriesInstanceUID),
    willTrackNewStudy: ctx => ctx.StudyInstanceUID !== ctx.trackedStudy,
    willBeEmpty: (ctx, evt) =>
      evt.SeriesInstanceUID &&
      ctx.trackedSeries.length === 1 &&
      ctx.trackedSeries[0] === evt.SeriesInstanceUID,
    acceptResponse: ctx => ctx.promptResponse === 1,
    cancelResponse: ctx => ctx.promptResponse === 0,
    rejectResponse: ctx => ctx.promptResponse === -1,
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
