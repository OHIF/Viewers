import { id } from './id';
import { longitudinalMode, longitudinalModeInstance, longitudinalRoute } from '@ohif/mode-longitudinal';

export const modeInstance = {
    ...longitudinalModeInstance,
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'template',
    displayName: 'Template Mode',
    routes: [
      longitudinalRoute
    ],
  };

export const mode = {
  ...longitudinalMode,
  id,
  modeInstance,
};

export default mode;
