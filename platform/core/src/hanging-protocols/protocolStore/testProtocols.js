import Protocol from '../classes/Protocol';
import ViewportStructure from '../classes/ViewportStructure';
import Viewport from '../classes/Viewport';
import Stage from '../classes/Stage';
import {
  ImageMatchingRule,
  ProtocolMatchingRule,
  SeriesMatchingRule,
} from '../classes';

function getMRTwoByTwoTest() {
  var proto = new Protocol('MR_TwoByTwo');
  proto.id = 'MR_TwoByTwo';
  proto.locked = true;
  // Use http://localhost:3000/viewer/1.2.840.113619.2.5.1762583153.215519.978957063.78

  var StudyInstanceUID = new ProtocolMatchingRule(
    'StudyInstanceUID',
    {
      equals: {
        value: '1.2.840.113619.2.5.1762583153.215519.978957063.78',
      },
    },
    true
  );

  proto.addProtocolMatchingRule(StudyInstanceUID);

  var oneByTwo = new ViewportStructure('grid', {
    Rows: 1,
    Columns: 2,
  });

  // Stage 1
  var left = new Viewport();
  var right = new Viewport();

  var firstSeries = new SeriesMatchingRule('SeriesNumber', {
    equals: {
      value: 1,
    },
  });

  var secondSeries = new SeriesMatchingRule('SeriesNumber', {
    equals: {
      value: 2,
    },
  });

  var thirdImage = new ImageMatchingRule('InstanceNumber', {
    equals: {
      value: 3,
    },
  });

  left.seriesMatchingRules.push(firstSeries);
  left.imageMatchingRules.push(thirdImage);

  right.seriesMatchingRules.push(secondSeries);
  right.imageMatchingRules.push(thirdImage);

  var first = new Stage(oneByTwo, 'oneByTwo');
  first.viewports.push(left);
  first.viewports.push(right);

  proto.stages.push(first);

  // Stage 2
  var twoByOne = new ViewportStructure('grid', {
    Rows: 2,
    Columns: 1,
  });
  var left2 = new Viewport();
  var right2 = new Viewport();

  var fourthSeries = new SeriesMatchingRule('SeriesNumber', {
    equals: {
      value: 4,
    },
  });

  var fifthSeries = new SeriesMatchingRule('SeriesNumber', {
    equals: {
      value: 5,
    },
  });

  left2.seriesMatchingRules.push(fourthSeries);
  left2.imageMatchingRules.push(thirdImage);
  right2.seriesMatchingRules.push(fifthSeries);
  right2.imageMatchingRules.push(thirdImage);

  var second = new Stage(twoByOne, 'twoByOne');
  second.viewports.push(left2);
  second.viewports.push(right2);

  proto.stages.push(second);

  return proto;
}

function getDemoProtocols() {
  const demoProtocols = [];

  /**
   * Demo #1
   */
  demoProtocols.push({
    id: 'demoProtocol1',
    locked: false,
    name: 'DFCI-CT-CHEST-COMPARE',
    createdDate: '2017-02-14T16:07:09.033Z',
    modifiedDate: '2017-02-14T16:18:43.930Z',
    availableTo: {},
    editableBy: {},
    protocolMatchingRules: [
      {
        id: '7tmuq7KzDMCWFeapc',
        weight: 2,
        required: false,
        attribute: 'x00081030',
        constraint: {
          contains: {
            value: 'DFCI CT CHEST',
          },
        },
      },
    ],
    stages: [
      {
        id: 'v5PfGt9F6mffZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: '2.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'ygz4nb28iJZcJhnYa',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: '2.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTvnXTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'XTzu8HB3feep3HYKs',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: '3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'ygz4nb28iJZcJhnYa',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: '3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTvnXTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:12.085Z',
      },
      {
        id: '3yPYNaeFtr76Qz3jq',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 2,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {
              wlPreset: 'Lung',
            },
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'ygz4nb28iJZcJhnYa',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: '6vdBRZYnqmmosipph',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'SxfTyhGcMhr56PtPM',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
          {
            viewportSettings: {
              wlPreset: 'Lung',
            },
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'FTAyChZCPW68yJjXD',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'gMJjfrbsqYNbErPx5',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:11:40.489Z',
      },
    ],
    numberOfPriorsReferenced: 4,
  });

  /**
   * Demo #2
   */

  demoProtocols.push({
    id: 'demoProtocol2',
    locked: false,
    name: 'DFCI-CT-CHEST-COMPARE-2',
    createdDate: '2017-02-14T16:07:09.033Z',
    modifiedDate: '2017-02-14T16:18:43.930Z',
    availableTo: {},
    editableBy: {},
    protocolMatchingRules: [
      {
        id: '7tmuq7KzDMCWFeapc',
        weight: 2,
        required: false,
        attribute: 'x00081030',
        constraint: {
          contains: {
            value: 'DFCI CT CHEST',
          },
        },
      },
    ],
    stages: [
      {
        id: 'v5PfGt9F6mffZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7mac',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: '2.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'ygz4nb28iJZcJhnYc',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: '2.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTvnXTByWnPt',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'XTzu8HB3feep3HYKs',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 3.0',
                  },
                },
              },
              {
                id: 'mYnsCcNwZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 5.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'ygz4nb28iJZcJhnYa',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 3.0',
                  },
                },
              },
              {
                id: 'ygz4nb29iJZcJhnYa',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 5.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTvnXTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:12.085Z',
      },
      {
        id: '3yPYNaeFtr76Qz3jq',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 2,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7mtr',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 3.0',
                  },
                },
              },
              {
                id: 'jXnsCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 5.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {
              wlPreset: 'Lung',
            },
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'ygz4nb28iJZcJhnYb',
                weight: 2,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 3.0',
                  },
                },
              },
              {
                id: 'ycz4nb28iJZcJhnYa',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 5.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: '6vdBRZYnqmmosipph',
                weight: 2,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 3.0',
                  },
                },
              },
              {
                id: '6vdBRFYnqmmosipph',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 5.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'SxfTyhGcMhr56PtPM',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
          {
            viewportSettings: {
              wlPreset: 'Lung',
            },
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'FTAyChZCPW68yJjXD',
                weight: 2,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 3.0',
                  },
                },
              },
              {
                id: 'DTAyChZCPW68yJjXD',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 5.0',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'gMJjfrbsqYNbErPx5',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:11:40.489Z',
      },
    ],
    numberOfPriorsReferenced: 1,
  });

  /**
   * Demo: screenCT
   */

  demoProtocols.push({
    id: 'screenCT',
    locked: false,
    name: 'DFCI-CT-CHEST-SCREEN',
    createdDate: '2017-02-14T16:07:09.033Z',
    modifiedDate: '2017-02-14T16:18:43.930Z',
    availableTo: {},
    editableBy: {},
    protocolMatchingRules: [
      {
        id: '7tmuq7KzDMCWFeapc',
        weight: 2,
        required: false,
        attribute: 'x00081030',
        constraint: {
          contains: {
            value: 'DFCI CT CHEST',
          },
        },
      },
    ],
    stages: [
      {
        id: 'v5PfGt9F6mffZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 1,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL55z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: '2.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'v5PfGt9F4mffZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 2,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7nTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 5.0',
                  },
                },
              },
              {
                id: 'mXnsCcNzZL56z7rTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56r7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 5.0',
                  },
                },
              },
              {
                id: 'mXnsCcNzZL56a7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Lung 3.0',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcRzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 4.0',
                  },
                },
              },
              {
                id: 'mXnsCcNzTL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Coronal',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcMzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Body 4.0',
                  },
                },
              },
              {
                id: 'mXnsCcAzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Sagittal',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
    ],
    numberOfPriorsReferenced: 0,
  });

  /**
   * Demo: PETCTSCREEN
   */

  demoProtocols.push({
    id: 'PETCTSCREEN',
    locked: false,
    name: 'PETCT-SCREEN',
    createdDate: '2017-02-14T16:07:09.033Z',
    modifiedDate: '2017-02-14T16:18:43.930Z',
    availableTo: {},
    editableBy: {},
    protocolMatchingRules: [
      {
        id: '7tmuqgKzDMCWFeapc',
        weight: 5,
        required: false,
        attribute: 'x00081030',
        constraint: {
          contains: {
            value: 'PETCT',
          },
        },
      },
    ],
    stages: [
      {
        id: 'v5PfGt9F6mFgZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcAzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Topogram',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZR56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Topogram',
                  },
                },
              },
              {
                id: 'mRnsCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x00200011',
                constraint: {
                  numericality: {
                    greaterThanOrEqualTo: 2,
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'v5PfGt9F6mFgZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsGcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'PET WB Corrected',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsHcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'CT WB',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'v5PfGt9F6mFgZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {
              invert: 'YES',
            },
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXneCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'PET WB Uncorrected',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCuNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'CT Nk',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
    ],
    numberOfPriorsReferenced: 0,
  });

  /**
   * Demo: PETCTCOMPARE
   */

  demoProtocols.push({
    id: 'PETCTCOMPARE',
    locked: false,
    name: 'PETCT-COMPARE',
    createdDate: '2017-02-14T16:07:09.033Z',
    modifiedDate: '2017-02-14T16:18:43.930Z',
    availableTo: {},
    editableBy: {},
    protocolMatchingRules: [
      {
        id: '7tmuqgKzDMCWFeapc',
        weight: 5,
        required: false,
        attribute: 'x00081030',
        constraint: {
          contains: {
            value: 'PETCT',
          },
        },
      },
    ],
    stages: [
      {
        id: 'v5PfGt9F6mFgZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL59z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Topogram',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7lTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Topogram',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTbnXTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'v5PfGt9F6mFgZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 1,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNjZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Topogram',
                  },
                },
              },
              {
                id: 'mXnsCcNzZL56z7gTZ',
                weight: 1,
                required: false,
                attribute: 'x00200011',
                constraint: {
                  numericality: {
                    greaterThanOrEqualTo: 2,
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcCzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'Topogram',
                  },
                },
              },
              {
                id: 'mXnsCcNzZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x00200011',
                constraint: {
                  numericality: {
                    greaterThanOrEqualTo: 2,
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTvn1TByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'v5PfGt9F6mFgZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 2,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL26z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'PET WB Corrected',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL46z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'CT WB',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL57z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'PET WB Corrected',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTvnYTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZQ56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'CT WB',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgLTvnKTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
      {
        id: 'v5PfGt9F6mFgZPif5',
        name: 'oneByOne',
        viewportStructure: {
          type: 'grid',
          properties: {
            Rows: 2,
            Columns: 2,
          },
          layoutTemplateName: 'gridLayout',
        },
        viewports: [
          {
            viewportSettings: {
              invert: 'YES',
            },
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZL56z7nTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'PET WB Uncorrected',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNxZL56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'CT Nk',
                  },
                },
              },
            ],
            studyMatchingRules: [],
          },
          {
            viewportSettings: {
              invert: 'YES',
            },
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZA56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'PET WB Uncorrected',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgHTvnXTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
          {
            viewportSettings: {},
            imageMatchingRules: [],
            seriesMatchingRules: [
              {
                id: 'mXnsCcNzZP56z7mTZ',
                weight: 1,
                required: false,
                attribute: 'x0008103e',
                constraint: {
                  contains: {
                    value: 'CT Nk',
                  },
                },
              },
            ],
            studyMatchingRules: [
              {
                id: 'uDoEgITvnXTByWnPz',
                weight: 1,
                required: false,
                attribute: 'abstractPriorValue',
                constraint: {
                  equals: {
                    value: 1,
                  },
                },
              },
            ],
          },
        ],
        createdDate: '2017-02-14T16:07:09.033Z',
      },
    ],
    numberOfPriorsReferenced: 1,
  });

  return demoProtocols;
}

const testProtocols = {
  getMRTwoByTwoTest,
  getDemoProtocols,
};

export default testProtocols;
