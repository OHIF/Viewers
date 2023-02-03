import * as OHIF from './index';

describe('Top level exports', () => {
  test('have not changed', () => {
    const expectedExports = [
      'MODULE_TYPES',
      //
      'CommandsManager',
      'ExtensionManager',
      'HotkeysManager',
      'ServicesManager',
      //
      'defaults',
      'utils',
      'hotkeys',
      'classes',
      'default', //
      'errorHandler',
      'string',
      'user',
      'object',
      'log',
      'DICOMWeb',
      'OHIF',
      //
      'CineService',
      'CustomizationService',
      'CustomizationServiceRegistration',
      'UIDialogService',
      'UIModalService',
      'UINotificationService',
      'UIViewportDialogService',
      'DisplaySetService',
      'DisplaySetServiceRegistration',
      'MeasurementService',
      'MeasurementServiceRegistration',
      'ToolbarService',
      'ToolbarServiceRegistration',
      'Types',
      'ViewportGridService',
      'ViewportGridServiceRegistration',
      'HangingProtocolService',
      'HangingProtocolServiceRegistration',
      'UserAuthenticationService',
      'IWebApiDataSource',
      'DicomMetadataStore',
      'pubSubServiceInterface',
      'PubSubService',
      'Services',
    ].sort();

    const exports = Object.keys(OHIF).sort();

    expect(exports).toEqual(expectedExports);
  });
});
