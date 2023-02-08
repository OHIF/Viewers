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
      'UIDialogService',
      'UIModalService',
      'UINotificationService',
      'UIViewportDialogService',
      'DisplaySetService',
      'MeasurementService',
      'ToolbarService',
      'Types',
      'ViewportGridService',
      'HangingProtocolService',
      'UserAuthenticationService',
      'IWebApiDataSource',
      'DicomMetadataStore',
      'pubSubServiceInterface',
      'PubSubService',
    ].sort();

    const exports = Object.keys(OHIF).sort();

    expect(exports).toEqual(expectedExports);
  });
});
