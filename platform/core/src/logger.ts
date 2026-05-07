import { logging } from '@cornerstonejs/utils';

const { getRootLogger } = logging;

export const ohifLog = getRootLogger('ohif');

/**
 * Default top-level package logger categories for OHIF packages.
 */
export const platformLog = ohifLog.getLogger('platform');
export const appLog = ohifLog.getLogger('app');
export const coreLog = ohifLog.getLogger('core');
export const uiLog = ohifLog.getLogger('ui');
export const extensionsLog = ohifLog.getLogger('extensions');
export const modesLog = ohifLog.getLogger('modes');
export const dataSourcesLog = ohifLog.getLogger('dataSources');

export const packageLoggers = {
  platform: platformLog,
  app: appLog,
  core: coreLog,
  ui: uiLog,
  extensions: extensionsLog,
  modes: modesLog,
  dataSources: dataSourcesLog,
};

export const getLogger = (...names: string[]) => ohifLog.getLogger(...names);

export default {
  ohifLog,
  getLogger,
  packageLoggers,
  platformLog,
  appLog,
  coreLog,
  uiLog,
  extensionsLog,
  modesLog,
  dataSourcesLog,
};
