import { vec3 } from 'gl-matrix';
import { Enums } from '@cornerstonejs/core';
import getClosestOrientationFromIOP, { isReferenceViewable } from './isReferenceViewable';

jest.mock('gl-matrix', () => ({
  vec3: {
    fromValues: jest.fn(),
    cross: jest.fn(),
    dot: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('@cornerstonejs/core', () => ({
  Enums: {
    OrientationAxis: {
      AXIAL: 'axial',
      CORONAL: 'coronal',
      SAGITTAL: 'sagittal',
    },
  },
}));

describe('isReferenceViewable', () => {
  const mockCornerstoneViewportService = {
    getCornerstoneViewport: jest.fn(),
  };

  const mockDisplaySetService = {
    getDisplaySetByUID: jest.fn(),
  };

  const mockServicesManager = {
    services: {
      cornerstoneViewportService: mockCornerstoneViewportService,
      displaySetService: mockDisplaySetService,
    },
  };

  const mockViewport = {
    isReferenceViewable: jest.fn(),
  };

  const mockReference = {
    displaySetInstanceUID: 'test-display-set-uid',
    referencedImageId: 'test-image-id',
  };

  const defaultParameters = {
    servicesManager: mockServicesManager,
    viewportId: 'test-viewport-id',
    reference: mockReference,
    viewportOptions: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCornerstoneViewportService.getCornerstoneViewport.mockReturnValue(mockViewport);
    mockViewport.isReferenceViewable.mockReturnValue(true);
  });

  it('should return viewport isReferenceViewable result when viewportOptions is undefined', () => {
    mockViewport.isReferenceViewable.mockReturnValue(true);

    const result = isReferenceViewable(
      defaultParameters.servicesManager,
      defaultParameters.viewportId,
      defaultParameters.reference
    );

    expect(mockCornerstoneViewportService.getCornerstoneViewport).toHaveBeenCalledWith(
      defaultParameters.viewportId
    );
    expect(mockViewport.isReferenceViewable).toHaveBeenCalledWith(mockReference, {
      withNavigation: true,
      asVolume: true,
    });
    expect(result).toBe(true);
  });

  it('should return false when viewport isReferenceViewable returns false', () => {
    mockViewport.isReferenceViewable.mockReturnValue(false);

    const result = isReferenceViewable(
      defaultParameters.servicesManager,
      defaultParameters.viewportId,
      defaultParameters.reference
    );

    expect(result).toBe(false);
  });

  it('should check imageIds inclusion for stack viewport type', () => {
    const mockDisplaySet = {
      instances: [{ imageId: 'image-1' }, { imageId: 'test-image-id' }, { imageId: 'image-3' }],
    };

    const viewportOptions = {
      viewportType: 'stack',
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const result = isReferenceViewable(
      defaultParameters.servicesManager,
      defaultParameters.viewportId,
      defaultParameters.reference,
      viewportOptions
    );

    expect(mockDisplaySetService.getDisplaySetByUID).toHaveBeenCalledWith(
      mockReference.displaySetInstanceUID
    );
    expect(result).toBe(true);
  });

  it('should return false when imageId is not in stack', () => {
    const mockDisplaySet = {
      instances: [{ imageId: 'image-1' }, { imageId: 'image-2' }, { imageId: 'image-3' }],
    };

    const viewportOptions = {
      viewportType: 'stack',
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const result = isReferenceViewable(
      defaultParameters.servicesManager,
      defaultParameters.viewportId,
      defaultParameters.reference,
      viewportOptions
    );

    expect(result).toBe(false);
  });

  it('should check orientation for volume viewport type', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
        },
      ],
    };

    const viewportOptions = {
      viewportType: 'volume',
      orientation: 'axial',
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [1, 0, 0];
    const mockColCosineVec = [0, 1, 0];
    const mockScanAxisNormal = [0, 0, 1];
    const mockAxialVector = [0, 0, 1];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock).mockReturnValue(1);

    const result = isReferenceViewable(
      defaultParameters.servicesManager,
      defaultParameters.viewportId,
      defaultParameters.reference,
      viewportOptions
    );

    expect(result).toBe(true);
  });

  it('should return false when orientation does not match', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
        },
      ],
    };

    const viewportOptions = {
      viewportType: 'volume',
      orientation: 'coronal',
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [1, 0, 0];
    const mockColCosineVec = [0, 1, 0];
    const mockScanAxisNormal = [0, 0, 1];
    const mockAxialVector = [0, 0, 1];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock).mockReturnValue(1);

    const result = isReferenceViewable(
      defaultParameters.servicesManager,
      defaultParameters.viewportId,
      defaultParameters.reference,
      viewportOptions
    );

    expect(result).toBe(false);
  });

  it('should handle empty instances array for stack viewport', () => {
    const mockDisplaySet = {
      instances: [],
    };

    const viewportOptions = {
      viewportType: 'stack',
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const result = isReferenceViewable(
      defaultParameters.servicesManager,
      defaultParameters.viewportId,
      defaultParameters.reference,
      viewportOptions
    );

    expect(result).toBe(false);
  });
});

describe('getClosestOrientationFromIOP', () => {
  const mockDisplaySetService = {
    getDisplaySetByUID: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return undefined when ImageOrientationPatient is not length 6', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, 1],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBeUndefined();
  });

  it('should return undefined when ImageOrientationPatient is undefined', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: undefined,
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBeUndefined();
  });

  it('should return undefined when ImageOrientationPatient is null', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: null,
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBeUndefined();
  });

  it('should return axial orientation for axial-aligned IOP', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [1, 0, 0];
    const mockColCosineVec = [0, 1, 0];
    const mockScanAxisNormal = [0, 0, 1];
    const mockAxialVector = [0, 0, 1];
    const mockCoronalVector = [0, 1, 0];
    const mockSagittalVector = [1, 0, 0];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector)
      .mockReturnValueOnce(mockCoronalVector)
      .mockReturnValueOnce(mockSagittalVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock)
      .mockReturnValueOnce(1.0)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBe(Enums.OrientationAxis.AXIAL);
  });

  it('should return coronal orientation for coronal-aligned IOP', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, 0, -1],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [1, 0, 0];
    const mockColCosineVec = [0, 0, -1];
    const mockScanAxisNormal = [0, 1, 0];
    const mockAxialVector = [0, 0, 1];
    const mockCoronalVector = [0, 1, 0];
    const mockSagittalVector = [1, 0, 0];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector)
      .mockReturnValueOnce(mockCoronalVector)
      .mockReturnValueOnce(mockSagittalVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(1.0)
      .mockReturnValueOnce(0.0);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBe(Enums.OrientationAxis.CORONAL);
  });

  it('should return sagittal orientation for sagittal-aligned IOP', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [0, 1, 0, 0, 0, -1],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [0, 1, 0];
    const mockColCosineVec = [0, 0, -1];
    const mockScanAxisNormal = [1, 0, 0];
    const mockAxialVector = [0, 0, 1];
    const mockCoronalVector = [0, 1, 0];
    const mockSagittalVector = [1, 0, 0];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector)
      .mockReturnValueOnce(mockCoronalVector)
      .mockReturnValueOnce(mockSagittalVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(1.0);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBe(Enums.OrientationAxis.SAGITTAL);
  });

  it('should handle negative dot products and return correct orientation', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, -1, 0],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [1, 0, 0];
    const mockColCosineVec = [0, -1, 0];
    const mockScanAxisNormal = [0, 0, -1];
    const mockAxialVector = [0, 0, 1];
    const mockCoronalVector = [0, 1, 0];
    const mockSagittalVector = [1, 0, 0];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector)
      .mockReturnValueOnce(mockCoronalVector)
      .mockReturnValueOnce(mockSagittalVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock)
      .mockReturnValueOnce(-1.0)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBe(Enums.OrientationAxis.AXIAL);
  });

  it('should handle oblique orientations and return closest match', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [0.7071, 0.7071, 0, 0, 0, 1],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [0.7071, 0.7071, 0];
    const mockColCosineVec = [0, 0, 1];
    const mockScanAxisNormal = [0.7071, -0.7071, 0];
    const mockAxialVector = [0, 0, 1];
    const mockCoronalVector = [0, 1, 0];
    const mockSagittalVector = [1, 0, 0];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector)
      .mockReturnValueOnce(mockCoronalVector)
      .mockReturnValueOnce(mockSagittalVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.7071)
      .mockReturnValueOnce(0.7071);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBe(Enums.OrientationAxis.CORONAL);
  });

  it('should handle zero dot products', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [1, 0, 0];
    const mockColCosineVec = [0, 1, 0];
    const mockScanAxisNormal = [0, 0, 1];
    const mockAxialVector = [0, 0, 1];
    const mockCoronalVector = [0, 1, 0];
    const mockSagittalVector = [1, 0, 0];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec)
      .mockReturnValueOnce(mockAxialVector)
      .mockReturnValueOnce(mockCoronalVector)
      .mockReturnValueOnce(mockSagittalVector);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(result).toBe('');
  });

  it('should call vec3 functions with correct parameters', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [1, 0, 0];
    const mockColCosineVec = [0, 1, 0];
    const mockCreatedVec = [];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec);

    (vec3.create as jest.Mock).mockReturnValue(mockCreatedVec);
    (vec3.cross as jest.Mock).mockReturnValue([0, 0, 1]);
    (vec3.dot as jest.Mock).mockReturnValue(1.0);

    getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(vec3.fromValues).toHaveBeenNthCalledWith(1, 1, 0, 0);
    expect(vec3.fromValues).toHaveBeenNthCalledWith(2, 0, 1, 0);
    expect(vec3.cross).toHaveBeenCalledWith(mockCreatedVec, mockRowCosineVec, mockColCosineVec);
  });

  it('should handle floating point IOP values', () => {
    const mockDisplaySet = {
      instances: [
        {
          ImageOrientationPatient: [0.866, 0.5, 0, -0.5, 0.866, 0],
        },
      ],
    };

    mockDisplaySetService.getDisplaySetByUID.mockReturnValue(mockDisplaySet);

    const mockRowCosineVec = [0.866, 0.5, 0];
    const mockColCosineVec = [-0.5, 0.866, 0];
    const mockScanAxisNormal = [0, 0, 1];

    (vec3.fromValues as jest.Mock)
      .mockReturnValueOnce(mockRowCosineVec)
      .mockReturnValueOnce(mockColCosineVec);

    (vec3.create as jest.Mock).mockReturnValue([]);
    (vec3.cross as jest.Mock).mockReturnValue(mockScanAxisNormal);
    (vec3.dot as jest.Mock)
      .mockReturnValueOnce(1.0)
      .mockReturnValueOnce(0.0)
      .mockReturnValueOnce(0.0);

    const result = getClosestOrientationFromIOP(mockDisplaySetService, 'test-display-set-uid');

    expect(vec3.fromValues).toHaveBeenNthCalledWith(1, 0.866, 0.5, 0);
    expect(vec3.fromValues).toHaveBeenNthCalledWith(2, -0.5, 0.866, 0);
    expect(result).toBe(Enums.OrientationAxis.AXIAL);
  });
});
