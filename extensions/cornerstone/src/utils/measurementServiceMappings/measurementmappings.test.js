import CobbAngle from './CobbAngle';
import Length from './Length';
import ArrowAnnotate from './ArrowAnnotate';
import Bidirectional from './Bidirectional';
import EllipticalRoi from './EllipticalRoi';

const displaySet = {
};

const measurementData = {
};

const cst = {
  toolType: "abc",
  element: {},
  measurementData,
};

const dss = {
  getDisplaySetForSOPInstanceUID: () => displaySet,
};

const getvt = val => `x${val}`;

jest.mock('cornerstone-core', () => ({
  ...jest.requireActual('cornerstone-core'),
  getEnabledElement: () => ({
    image: { imageId: 123 },
  }),
  metaData: {
    ...jest.requireActual('cornerstone-core').metaData,
    get: () => ({
      SOPInstanceUID: '123',
      FrameOfReferenceUID: '123',
      SeriesInstanceUID: '123',
      StudyInstanceUID: '1234',
    }),
  },
}));

describe('measurementMappings', () => {

  it('fails on invalid type', () => {
    cst.toolType = "invalid";
    expect(() => CobbAngle.toMeasurement(cst, dss, getvt))
      .toThrow();
    expect(() => Length.toMeasurement(cst, dss, getvt))
      .toThrow();
    expect(() => ArrowAnnotate.toMeasurement(cst, dss, getvt))
      .toThrow();
    expect(() => Bidirectional.toMeasurement(cst, dss, getvt))
      .toThrow();
    expect(() => EllipticalRoi.toMeasurement(cst, dss, getvt))
      .toThrow();
  })

  describe('CobbAngle', () => {
    beforeEach(() => {
      cst.toolType = "CobbAngle";
      measurementData.handles = {
        start1: { x: 1, y: 2 },
        end1: { x: 2, y: 3 },
        start2: { x: 3, y: 4 },
        end2: { x: 4, y: 5 },
      };
      measurementData.rAngle = 47;
    });

    it('maps angle measurement', () => {
      const value = CobbAngle.toMeasurement(cst, dss, getvt);
      expect(value.rAngle).toBe(47);
    })
  })

  describe('Length', () => {
    beforeEach(() => {
      cst.toolType = "Length";
      measurementData.handles = {
        start: { x: 1, y: 2 },
        end: { x: 2, y: 3 },
      };
      measurementData.length = 13;
    });

    it('maps length measurement', () => {
      const value = Length.toMeasurement(cst, dss, getvt);
      expect(value.length).toBe(13);
    })
  })


  describe('Bidirectional', () => {
    beforeEach(() => {
      cst.toolType = "Bidirectional";
      measurementData.handles = {
        start: { x: 1, y: 2 },
        end: { x: 2, y: 3 },
        perpendicularStart: { x: 3, y: 4 },
        perpendicularEnd: { x: 4, y: 5 },
      };
      measurementData.unit = "mm";
    });

    it('maps bidir measurement', () => {
      const value = Bidirectional.toMeasurement(cst, dss, getvt);
      expect(value.unit).toBe("mm");
    })
  })


  describe('ArrowAnnotate', () => {
    beforeEach(() => {
      cst.toolType = "ArrowAnnotate";
      measurementData.handles = {
        start: { x: 1, y: 2 },
        end: { x: 2, y: 3 },
      };
      measurementData.text = "text";
    });

    it('maps length measurement', () => {
      const value = ArrowAnnotate.toMeasurement(cst, dss, getvt);
      expect(value.text).toBe("text");
    })
  })
})
