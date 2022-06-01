import * as OHIF from './index.js';

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
      'UIDialogService',
      'UIModalService',
      'UINotificationService',
      'UIViewportDialogService',
      'DisplaySetService',
      'MeasurementService',
      'ToolBarService',
      'ViewportGridService',
      'SegmentationService',
      'HangingProtocolService',
      'UserAuthenticationService',
      'IWebApiDataSource',
      'DicomMetadataStore',
      'pubSubServiceInterface',
    ].sort();

    const exports = Object.keys(OHIF).sort();

    expect(exports).toEqual(expectedExports);
  });
});
