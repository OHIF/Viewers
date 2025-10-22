import getFilteredCornerstoneToolState from './getFilteredCornerstoneToolState';

// Mock the annotation state
jest.mock('@cornerstonejs/tools', () => ({
  annotation: {
    state: {
      getAnnotationManager: jest.fn(() => ({
        getFramesOfReference: jest.fn(() => ['frame1']),
        getAnnotations: jest.fn(() => ({
          CustomProbe: [
            {
              annotationUID: 'test-uid-1',
              metadata: {
                referencedImageId: 'test-image-id',
              },
            },
          ],
          Probe: [
            {
              annotationUID: 'test-uid-2',
              metadata: {
                referencedImageId: 'test-image-id',
              },
            },
          ],
        })),
      })),
    },
  },
}));

// Mock OHIF
jest.mock('@ohif/core', () => ({
  log: {
    warn: jest.fn(),
  },
}));

describe('getFilteredCornerstoneToolState', () => {
  it('should map CustomProbe annotations to Probe tool type for SR compatibility', () => {
    const measurementData = [
      {
        uid: 'test-uid-1',
        label: 'Test CustomProbe',
        findingSites: [],
      },
      {
        uid: 'test-uid-2',
        label: 'Test Probe',
        findingSites: [],
      },
    ];

    const additionalFindingTypes = ['CustomProbe'];

    const result = getFilteredCornerstoneToolState(measurementData, additionalFindingTypes);

    // Verify that CustomProbe annotations are mapped to Probe
    expect(result['test-image-id']).toBeDefined();
    expect(result['test-image-id'].Probe).toBeDefined();
    expect(result['test-image-id'].Probe.data).toHaveLength(2);

    // Verify that both CustomProbe and Probe annotations are stored under Probe
    const probeData = result['test-image-id'].Probe.data;
    expect(probeData[0].annotationUID).toBe('test-uid-1');
    expect(probeData[1].annotationUID).toBe('test-uid-2');

    // Verify that CustomProbe is not present as a separate tool type
    expect(result['test-image-id'].CustomProbe).toBeUndefined();
  });

  it('should preserve original tool type for finding logic while mapping for storage', () => {
    const measurementData = [
      {
        uid: 'test-uid-1',
        label: 'Test CustomProbe',
        findingSites: [],
      },
    ];

    const additionalFindingTypes = ['CustomProbe'];

    const result = getFilteredCornerstoneToolState(measurementData, additionalFindingTypes);

    // Verify that the annotation is stored under Probe
    expect(result['test-image-id'].Probe.data).toHaveLength(1);

    // Verify that the finding logic uses the original tool type
    const annotation = result['test-image-id'].Probe.data[0];
    expect(annotation.finding).toBeDefined();
    expect(annotation.finding.CodeMeaning).toBe('Test CustomProbe');
  });

  it('should handle non-CustomProbe tools normally', () => {
    const measurementData = [
      {
        uid: 'test-uid-2',
        label: 'Test Probe',
        findingSites: [],
      },
    ];

    const additionalFindingTypes = [];

    const result = getFilteredCornerstoneToolState(measurementData, additionalFindingTypes);

    // Verify that Probe annotations remain as Probe
    expect(result['test-image-id'].Probe).toBeDefined();
    expect(result['test-image-id'].Probe.data).toHaveLength(1);
    expect(result['test-image-id'].Probe.data[0].annotationUID).toBe('test-uid-2');
  });
});
