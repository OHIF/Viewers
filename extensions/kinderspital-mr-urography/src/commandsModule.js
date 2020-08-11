import { incrementTimePoint, getToolState } from 'cornerstone-tools';

// This feels bad but the cornerstone extension does all the tracking currently,
// And this extension explictly depends on cornerstone anyway.
import { getEnabledElement } from '@ohif/extension-cornerstone';

const commandsModule = () => {
  const actions = {
    nextTimePointIf4D: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);
      const stackData = getToolState(enabledElement, 'stack');
      if (!stackData || !stackData.data || !stackData.data.length) return;

      if (stackData.data.length > 1) {
        const timeSeriesToolData = getToolState(enabledElement, 'timeSeries');

        if (timeSeriesToolData && timeSeriesToolData.data) {
          incrementTimePoint(enabledElement, 1, false);

          return;
        }
      }
    },
    previousTimePointIf4D: ({ viewports }) => {
      const enabledElement = getEnabledElement(viewports.activeViewportIndex);
      const stackData = getToolState(enabledElement, 'stack');
      if (!stackData || !stackData.data || !stackData.data.length) return;

      if (stackData.data.length > 1) {
        const timeSeriesToolData = getToolState(enabledElement, 'timeSeries');

        if (timeSeriesToolData && timeSeriesToolData.data) {
          incrementTimePoint(enabledElement, -1, false);

          return;
        }
      }
    },
  };

  const definitions = {
    nextTimePointIf4D: {
      commandFn: actions.nextTimePointIf4D,
      storeContexts: ['viewports'],
      options: {},
    },
    previousTimePointIf4D: {
      commandFn: actions.previousTimePointIf4D,
      storeContexts: ['viewports'],
      options: {},
    },
  };

  return {
    actions,
    definitions,
    defaultContext: 'ACTIVE_VIEWPORT::CORNERSTONE',
  };
};

export default commandsModule;
