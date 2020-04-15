/**
 *
 */
export default {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id: 'example-extension',

  /**
   * LIFECYCLE HOOKS
   */

  preRegistration({
    servicesManager = {},
    commandsManager = {},
    appConfig = {},
    configuration = {},
  }) {},

  /**
   * MODULE GETTERS
   */
  getViewportModule() {
    return '... react component ...';
  },
  getSopClassHandlerModule() {
    return sopClassHandlerModule;
  },
  getPanelModule() {
    return panelModule;
  },
  getToolbarModule() {
    return panelModule;
  },
  getCommandsModule(/* store */) {
    return commandsModule;
  },
};

/**
 *
 */
const commandsModule = {
  actions: {
    // Store Contexts + Options
    exampleAction: ({ viewports, param1 }) => {
      console.log(`There are ${viewports.length} viewports`);
      console.log(`param1's value is: ${param1}`);
    },
  },
  definitions: {
    exampleActionDef: {
      commandFn: this.actions.exampleAction,
      storeContexts: ['viewports'],
      options: { param1: 'hello world' },
    },
  },
};

/**
 *
 */
const sopClassHandlerModule = {
  id: 'OHIFDicomHtmlSopClassHandler',
  sopClassUIDs: Object.values({
    BASIC_TEXT_SR: '1.2.840.10008.5.1.4.1.1.88.11',
    ENHANCED_SR: '1.2.840.10008.5.1.4.1.1.88.22',
    COMPREHENSIVE_SR: '1.2.840.10008.5.1.4.1.1.88.33',
    PROCEDURE_LOG_STORAGE: '1.2.840.10008.5.1.4.1.1.88.40',
    MAMMOGRAPHY_CAD_SR: '1.2.840.10008.5.1.4.1.1.88.50',
    CHEST_CAD_SR: '1.2.840.10008.5.1.4.1.1.88.65',
    X_RAY_RADIATION_DOSE_SR: '1.2.840.10008.5.1.4.1.1.88.67',
  }),
  getDisplaySetFromSeries(series, study, dicomWebClient, authorizationHeaders) {
    const instance = series.getFirstInstance();

    return {
      plugin: 'html',
      displaySetInstanceUID: 0, //utils.guid(),
      wadoRoot: study.getData().wadoRoot,
      wadoUri: instance.getData().wadouri,
      SOPInstanceUID: instance.getSOPInstanceUID(),
      SeriesInstanceUID: series.getSeriesInstanceUID(),
      StudyInstanceUID: study.getStudyInstanceUID(),
      authorizationHeaders,
    };
  },
};

/**
 *
 */
const panelModule = {
  menuOptions: [
    {
      icon: 'th-list',
      label: 'Segments',
      target: 'segment-panel',
      isDisabled: studies => {
        return false;
      },
    },
  ],
  components: [
    {
      id: 'segment-panel',
      component: '... react component ...',
    },
  ],
  defaultContext: ['VIEWER'],
};
