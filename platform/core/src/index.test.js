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
      'DicomMetadataStore',
      //
      'CineService',
      'DisplaySetService',
      'HangingProtocolService',
      'ToolBarService',
      'UINotificationService',
      'UIModalService',
      'UIDialogService',
      'UIViewportDialogService',
      'MeasurementService',
      'ViewportGridService',
      //
      'IWebApiDataSource',
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
      'DICOMSR',
      'OHIF', //
    ].sort();

    const exports = Object.keys(OHIF).sort();

    expect(exports).toEqual(expectedExports);
  });
});
