const actionOptionsMap: { [key: string]: string[] } = {
  Measurement: ['Rename', 'Lock', 'Delete'],
  Segmentation: ['Rename', 'Lock', 'Export', 'Delete'],
  'ROI Tools': ['Rename', 'Lock', 'Delete'],
  'Organ Segmentation': ['Rename', 'Lock', 'Export', 'Delete'],
  // Add more types and their corresponding actions as needed
};

const dataList = [
  {
    type: 'Measurement',
    items: [
      {
        id: 1,
        title: 'Measurement Label',
        description: 'Description for Measurement One.',
        optionalField: 'Optional Info 1',
        details: { primary: ['Data'], secondary: [] },
      },
      {
        id: 2,
        title: 'Measurement Label',
        description: 'Description for Measurement Two.',
        details: { primary: ['Data'], secondary: [] },
      },
    ],
  },
  {
    type: 'Segmentation',
    items: [
      {
        id: 3,
        title: 'Segmentation One',
        colorHex: '#FF5733',
        description: 'Description for Segmentation One.',
      },
      {
        id: 4,
        title: 'Segmentation Two',
        colorHex: '#FF5733',
        description: 'Description for Segmentation Two.',
      },
      {
        id: 5,
        title: 'Segmentation Three',
        colorHex: '#FF5733',
        description: 'Description for Segmentation Three.',
      },
    ],
  },
  {
    type: 'ROI Tools',
    items: [
      {
        id: 6,
        title: 'Linear',
        description: 'Description for Linear.',
        details: { primary: ['49.2 mm'], secondary: ['S2 I:1'] },
      },
      {
        id: 7,
        title: 'Bidirectional',
        description: 'Description for Bidirectional.',
        details: { primary: ['L: 34.5 mm', 'W: 23.0 mm'], secondary: ['S:2 I:2'] },
      },
      {
        id: 8,
        title: 'Ellipse',
        description: 'Description for Ellipse.',
        details: { primary: ['2641 mm²', 'Max: 1087 HU'], secondary: ['S:2 I:4'] },
      },
      {
        id: 9,
        title: 'Rectangle',
        description: 'Description for Rectangle.',
        details: { primary: ['1426 mm²', 'Max: 718 HU'], secondary: ['S:2 I:5'] },
      },
      {
        id: 10,
        title: 'Circle',
        description: 'Description for Circle.',
        details: { primary: ['7339 mm²', 'Max: 871 HU'], secondary: ['S:2 I:6'] },
      },
      {
        id: 11,
        title: 'Freehand ROI',
        description: 'Description for Freehand ROI.',
        details: {
          primary: ['Mean: 215 HU', 'Max: 947 HU', 'Area: 839 mm²'],
          secondary: ['S:2 I:7', 'S:3 I:7'],
        },
      },
      {
        id: 12,
        title: 'Spline Tool',
        description: 'Description for Spline Tool.',
        details: { primary: ['Area: 203 mm²'], secondary: ['S:2 I:8'] },
      },
      {
        id: 13,
        title: 'Livewire Tool',
        description: 'Description for Livewire Tool.',
        details: { primary: ['Area: 203 mm²'], secondary: ['S:2 I:3'] },
      },
      {
        id: 14,
        title: 'Annotation Lorem ipsum dolor sit amet long measurement name continues here',
        description: 'Description for Annotation.',
        details: { primary: ['Area: 203 mm²'], secondary: ['S:2 I:3'] },
      },
    ],
  },
  {
    type: 'Organ Segmentation',
    items: [
      {
        id: 15,
        title: 'Spleen',
        description: 'Description for Spleen.',
        colorHex: '#6B8E23',
      },
      {
        id: 16,
        title: 'Kidney',
        description: 'Description for Kidney.',
        colorHex: '#4682B4',
      },
      {
        id: 17,
        title: 'Kidney very long title name lorem ipsum dolor sit amet segmentation',
        description: 'Description for Kidney.',
        colorHex: '#9ACD32',
      },
      {
        id: 18,
        title: 'Gallbladder',
        description: 'Description for Gallbladder.',
        colorHex: '#20B2AA',
      },
      {
        id: 19,
        title: 'Esophagus',
        description: 'Description for Esophagus.',
        colorHex: '#DAA520',
      },
      {
        id: 20,
        title: 'Liver',
        description: 'Description for Liver.',
        colorHex: '#CD5C5C',
      },
      {
        id: 21,
        title: 'Stomach',
        description: 'Description for Stomach.',
        colorHex: '#778899',
      },
      {
        id: 22,
        title: 'Abdominal aorta',
        description: 'Description for Abdominal Aorta.',
        colorHex: '#B8860B',
      },
      {
        id: 23,
        title: 'Inferior vena cava',
        description: 'Description for Inferior Vena Cava.',
        colorHex: '#556B2F',
      },
      {
        id: 24,
        title: 'Portal vein',
        description: 'Description for Portal Vein.',
        colorHex: '#8B4513',
      },
      {
        id: 25,
        title: 'Pancreas',
        description: 'Description for Pancreas.',
        colorHex: '#2F4F4F',
      },
      {
        id: 26,
        title: 'Adrenal gland',
        description: 'Description for Adrenal Gland.',
        colorHex: '#708090',
      },
      {
        id: 27,
        title: 'Adrenal gland',
        description: 'Description for Adrenal Gland.',
        colorHex: '#6A5ACD',
      },
      {
        id: 28,
        title: 'New Seg Test New Seg Test New Seg Test New Seg Test New Seg Test New Seg Test ',
        description: 'Description for New Seg Test.',
        colorHex: '#4682B4',
      },
    ],
  },
  {
    type: 'TMTV1',
    items: [
      {
        id: 29,
        title: 'Segment 1',
        colorHex: '#FF6F61',
        description: 'Description for Segmentation One.',
        details: { primary: ['SUV Peak: NaN', 'Volume: 21.56mm³'], secondary: [] },
      },
      {
        id: 30,
        title: 'Segment 2',
        colorHex: '#00CED1',
        description: 'Description for Segmentation Two.',
        details: { primary: ['SUV Peak: NaN', 'Volume: 21.56mm³'], secondary: [] },
      },
      {
        id: 31,
        title: 'Segment 3',
        colorHex: '#88B04B',
        description: 'Description for Segmentation One.',
        details: { primary: ['SUV Peak: NaN', 'Volume: 21.56mm³'], secondary: [] },
      },
    ],
  },
  {
    type: 'TMTV2',
    items: [
      {
        id: 32,
        title: 'Segment A',
        colorHex: '#FF6F61',
        description: 'Description for Segmentation One.',
        details: { primary: ['SUV Peak: NaN', 'Volume: 21.56mm³'], secondary: [] },
      },
      {
        id: 33,
        title: 'Segment B',
        colorHex: '#00CED1',
        description: 'Description for Segmentation Two.',
        details: { primary: ['SUV Peak: NaN', 'Volume: 21.56mm³'], secondary: [] },
      },
      {
        id: 34,
        title: 'Segment C',
        colorHex: '#88B04B',
        description: 'Description for Segmentation One.',
        details: { primary: ['SUV Peak: NaN', 'Volume: 21.56mm³'], secondary: [] },
      },
    ],
  },
];

export { actionOptionsMap, dataList };
