import { Machine, interpret } from 'xstate';

// {
//   "type": "TRACK_SERIES",
//   "StudyInstanceUID": "study1",
//   "SeriesInstanceUID": "series1"
// }

// TODO:
// userPrompts should invoke promises:
// https://egghead.io/lessons/xstate-invoking-a-promise-for-asynchronous-state-transitions-in-xstate

const config = {
  id: 'measurementTracking',
  initial: 'notTracking',
  context: {
    prevTrackedStudy: '',
    prevTrackedSeries: [],
    trackedStudy: '',
    trackedSeries: [],
  },
  states: {
    notTracking: {
      on: {
        TRACK_SERIES: {
          target: 'userPromptShouldTrack',
          actions: 'trackSeries',
        },
      }
    },
    userPromptShouldTrack: {
      on: {
        YES: 'tracking',
        CANCEL: 'notTracking',
        NEVER: 'neverTracking',
      },
    },
    neverTracking: {
      type: 'final',
    },
    tracking: {
      on: {
        TRACK_SERIES: [
          { target: 'tracking', cond: 'hasNewSeriesForTrackedStudy', actions: 'trackSeries' },
          { target: 'userPromptTrackingConflict', cond: 'hasConflictingStudyInstanceUID', actions: ['setPrevTracked', 'clearTrackedSeries', 'trackSeries'] },
        ],
        UNTRACK_SERIES: [
          { target: 'tracking', cond: '', actions: ''},
          { target: 'notTracking', cond: '', actions: '' },
        ],
      },
    },
    userPromptShouldTrackNewStudy: {
      on: {
        CANCEL: {
          target: 'tracking',
          actions: 'restorePrevTracked',
        },
        YES: 'tracking',
      },
    },
  },
  strict: true,
};

// Actions:
// - entry
// - exit
// - transition (on)

// Activities:
// - can return a "clean-up" function to call on exit

// actions, guards, services, activities, delays
const options = {
  actions: {
    logStuff: (context, event) => { console.log(context, event ) },
    setPrevTracked: assign(context => ({
      prevTrackedStudy: context.trackedStudy,
      prevTrackedSeries: context.trackedSeries.slice(),
    })),
    restorePrevTracked: assign(context => ({
      trackedStudy: context.prevTrackedStudy,
      trackedSeries: context.prevTrackedSeries.slice(),
    })),
    clearTrackedSeries: assign(() => ({
      trackedStudy: '',
      trackedSeries: [],
    })),
    trackSeries: assign((context, event) =>
      {
        console.log(context, event);
        const prevTrackedSeries = context.trackedSeries.slice();
        return {
          trackedStudy: event.StudyInstanceUID || '',
          trackedSeries: [...prevTrackedSeries, event.SeriesInstanceUID],
        }
    }),
  },
  guards: {
    hasConflictingStudyInstanceUID: (context, event) =>
      context.StudyInstanceUID !== context.trackedStudy,
    hasNewSeriesForTrackedStudy: (context, event) =>
      event.StudyInstanceUID === context.trackedStudy &&
      !context.trackedSeries.includes(event.SeriesInstanceUID),
  },
}

const measurementTrackingMachine = Machine(config, options);
// .transition(state, eventArgument).value
const service = interpret(measurementTrackingMachine).start();
// .send(event): nextState
// .state (getter)
// .onTransition(state => { state.vale })

export default measurementTrackingMachine;
