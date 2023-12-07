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
      'UINotificationService',
      'UIModalService',
      'UIDialogService',
      'MeasurementService',
      'LoggerService',
      //
      'utils',
      'hotkeys',
      'studies',
      'redux',
      'classes',
      'metadata',
      'header',
      'cornerstone',
      'default', //
      'errorHandler',
      'str2ab',
      'string',
      'ui',
      'user',
      'object',
      'log',
      'DICOMWeb',
      'DICOMSR',
      'OHIF', //
      'measurements',
      'hangingProtocols',
    ].sort();

    const exports = Object.keys(OHIF).sort();

    expect(exports).toEqual(expectedExports);
  });
});
