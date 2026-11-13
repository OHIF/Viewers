import getDicomMicroscopySRSopClassHandler from './DicomMicroscopySRSopClassHandler';

jest.mock('./utils/loadSR', () => jest.fn());

describe('DicomMicroscopySRSopClassHandler extendDisplaySet', () => {
  it('gives an SR that is not Comprehensive 3D SR to the unsupported handler', () => {
    const unsupported = { extendDisplaySet: jest.fn() };
    const extensionManager = { getModuleEntry: jest.fn(() => unsupported) };
    const handler = getDicomMicroscopySRSopClassHandler({
      servicesManager: { services: {} },
      extensionManager,
    });
    const displaySet = {
      instances: [{ SOPClassUID: '1.2.840.10008.5.1.4.1.1.88.11' }], // Basic Text SR
    };
    const options = { extensionManager, servicesManager: { services: {} } };

    handler.extendDisplaySet(displaySet, options);

    expect(extensionManager.getModuleEntry).toHaveBeenCalledWith(
      '@ohif/extension-default.sopClassHandlerModule.not-supported-display-sets-handler'
    );
    expect(unsupported.extendDisplaySet).toHaveBeenCalledWith(displaySet, options);
    expect(displaySet.plugin).toBeUndefined();
  });
});
