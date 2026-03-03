import { generateSegmentationCSVReport } from './generateSegmentationCSVReport';

// Mock DOM APIs
Object.defineProperty(global, 'Blob', {
  writable: true,
  value: jest.fn().mockImplementation((content, options) => ({
    content,
    options,
  })),
});

Object.defineProperty(global, 'URL', {
  writable: true,
  value: {
    createObjectURL: jest.fn().mockReturnValue('mock-url'),
    revokeObjectURL: () => undefined,
  },
});

const mockDocument = {
  addEventListener: jest.fn(),
  createElement: jest.fn().mockReturnValue({
    setAttribute: jest.fn(),
    click: jest.fn(),
    style: {},
  }),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
  },
};

Object.defineProperty(global, 'document', {
  writable: true,
  value: mockDocument,
});

describe('generateSegmentationCSVReport', () => {
  const mockInfo = {
    reference: {
      SeriesNumber: '1',
      SeriesInstanceUID: 'series-uid-123',
      StudyInstanceUID: 'study-uid-456',
      SeriesDate: '20231201',
      SeriesTime: '120000',
      SeriesDescription: 'Test Series',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate CSV with basic segmentation data', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      label: 'Test Segmentation',
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    expect(global.Blob).toHaveBeenCalledWith([expect.stringContaining('Segmentation ID,seg-123')], {
      type: 'text/csv;charset=utf-8;',
    });
  });

  it('should handle segmentation data without id and label', () => {
    const segmentationData = {};

    generateSegmentationCSVReport(segmentationData, mockInfo);

    expect(global.Blob).toHaveBeenCalledWith(
      [expect.stringContaining('Segmentation ID,\nSegmentation Label,')],
      { type: 'text/csv;charset=utf-8;' }
    );
  });

  it('should include reference information when provided', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      label: 'Test Segmentation',
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    expect(global.Blob).toHaveBeenCalledWith(
      [expect.stringContaining('reference Series Number,1')],
      { type: 'text/csv;charset=utf-8;' }
    );
  });

  it('should skip empty reference values', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      label: 'Test Segmentation',
    };
    const infoWithEmptyValues = {
      reference: {
        SeriesNumber: '1',
        SeriesInstanceUID: '',
        StudyInstanceUID: null,
        SeriesDate: undefined,
        SeriesTime: '120000',
        SeriesDescription: 'Test Series',
      },
    };

    generateSegmentationCSVReport(segmentationData, infoWithEmptyValues);

    const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
    expect(csvContent).toContain('reference Series Number,1');
    expect(csvContent).toContain('reference Series Time,120000');
    expect(csvContent).not.toContain('reference Series Instance UID');
    expect(csvContent).not.toContain('reference Study Instance UID');
    expect(csvContent).not.toContain('reference Series Date');
  });

  it('should handle segments with basic properties', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      label: 'Test Segmentation',
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          locked: true,
          active: false,
        },
        '2': {
          segmentIndex: 2,
          label: 'Segment 2',
          locked: false,
          active: true,
        },
      },
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
    expect(csvContent).toContain('Label,Segment 1,Segment 2');
    expect(csvContent).toContain('Segment Index,1,2');
    expect(csvContent).toContain('Locked,Yes,No');
    expect(csvContent).toContain('Active,No,Yes');
  });

  it('should handle segments with statistics', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      label: 'Test Segmentation',
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          locked: false,
          active: true,
          cachedStats: {
            namedStats: {
              mean: {
                name: 'mean',
                label: 'Mean',
                value: 100.5,
                unit: 'HU',
              },
              volume: {
                name: 'volume',
                label: 'Volume',
                value: 250.75,
                unit: 'mm³',
              },
            },
          },
        },
      },
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
    expect(csvContent).toContain('Mean (HU),100.5');
    expect(csvContent).toContain('Volume (mm³),250.75');
  });

  it('should handle segments with statistics without units', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            namedStats: {
              count: {
                name: 'count',
                label: 'Count',
                value: 42,
              },
            },
          },
        },
      },
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
    expect(csvContent).toContain('Count,42');
  });

  it('should handle segments without cachedStats', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          locked: false,
          active: true,
        },
      },
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    expect(global.Blob).toHaveBeenCalled();
  });

  it('should handle segments with empty namedStats', () => {
    const segmentationData = {
      segmentationId: 'seg-123',
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            namedStats: {},
          },
        },
      },
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    expect(global.Blob).toHaveBeenCalled();
  });

  it('should escape CSV special characters', () => {
    const segmentationData = {
      segmentationId: 'seg,with,commas',
      label: 'Test "quoted" label',
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment\nwith\nnewlines',
          cachedStats: {
            namedStats: {
              test: {
                name: 'test',
                label: 'Test,Value',
                value: 'value"with"quotes',
              },
            },
          },
        },
      },
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    const csvContent = (global.Blob as jest.Mock).mock.calls[0][0][0];
    expect(csvContent).toContain('"seg,with,commas"');
    expect(csvContent).toContain('"Test ""quoted"" label"');
    expect(csvContent).toContain('"Segment\nwith\nnewlines"');
  });

  it('should create download link with correct attributes', () => {
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };
    mockDocument.createElement.mockReturnValue(mockLink);

    const segmentationData = {
      segmentationId: 'seg-123',
      label: 'Test Segmentation',
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'mock-url');
    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      'download',
      expect.stringMatching(/Test Segmentation_Report_\d{4}-\d{2}-\d{2}\.csv/)
    );
    expect(mockLink.click).toHaveBeenCalled();
    expect(mockDocument.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(mockDocument.body.removeChild).toHaveBeenCalledWith(mockLink);
  });

  it('should use default filename when label is missing', () => {
    const mockLink = {
      setAttribute: jest.fn(),
      click: jest.fn(),
      style: {},
    };
    mockDocument.createElement.mockReturnValue(mockLink);

    const segmentationData = {
      segmentationId: 'seg-123',
    };

    generateSegmentationCSVReport(segmentationData, mockInfo);

    expect(mockLink.setAttribute).toHaveBeenCalledWith(
      'download',
      expect.stringMatching(/Segmentation_Report_\d{4}-\d{2}-\d{2}\.csv/)
    );
  });
});
