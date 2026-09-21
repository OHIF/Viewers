import { debugMode } from './config';

export default (message, level = 'log') => {
  if (debugMode) {
    console[level]('@ohif/i18n: ', message);
  }
};
