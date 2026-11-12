export default {
  'cornerstone.measurements': {
    Angle: {
      displayText: [],
      report: [],
    },
    CobbAngle: {
      displayText: [],
      report: [],
    },
    ArrowAnnotate: {
      displayText: [],
      report: [],
    },
    RectangleROi: {
      displayText: [],
      report: [],
    },
    CircleROI: {
      displayText: [],
      report: [],
    },
    EllipticalROI: {
      displayText: [],
      report: [],
    },
    Bidirectional: {
      displayText: [],
      report: [],
    },
    Length: {
      displayText: [],
      report: [],
    },
    LivewireContour: {
      displayText: [],
      report: [],
    },
    SplineROI: {
      displayText: [
        {
          displayName: 'Areas',
          value: 'area',
          type: 'value',
        },
        {
          value: 'areaUnits',
          for: ['area'],
          type: 'unit',
        },
      ],
      report: [
        {
          displayName: 'Area',
          value: 'area',
          type: 'value',
        },
        {
          displayName: 'Unit',
          value: 'areaUnits',
          type: 'value',
        },
      ],
    },
    PlanarFreehandROI: {
      displayTextOpen: [
        {
          displayName: 'Length',
          value: 'length',
          type: 'value',
        },
      ],
      displayText: [
        {
          displayName: 'Mean',
          value: 'mean',
          type: 'value',
        },
        {
          displayName: 'Max',
          value: 'max',
          type: 'value',
        },
        {
          displayName: 'Area',
          value: 'area',
          type: 'value',
        },
        {
          value: 'pixelValueUnits',
          for: ['mean', 'max'],
          type: 'unit',
        },
        {
          value: 'areaUnits',
          for: ['area'],
          type: 'unit',
        },
      ],
      report: [
        {
          displayName: 'Mean',
          value: 'mean',
          type: 'value',
        },
        {
          displayName: 'Max',
          value: 'max',
          type: 'value',
        },
        {
          displayName: 'Area',
          value: 'area',
          type: 'value',
        },
        {
          displayName: 'Unit',
          value: 'unit',
          type: 'value',
        },
      ],
    },
  },
};
