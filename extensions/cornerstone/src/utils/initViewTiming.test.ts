import { log, Enums } from '@ohif/core';
import { EVENTS } from '@cornerstonejs/core';
import initViewTiming from './initViewTiming';

jest.mock('@ohif/core', () => ({
  log: {
    timingKeys: {},
    timeEnd: jest.fn(),
  },
  Enums: {
    TimingEnum: {
      DISPLAY_SETS_TO_ALL_IMAGES: 'DISPLAY_SETS_TO_ALL_IMAGES',
      DISPLAY_SETS_TO_FIRST_IMAGE: 'DISPLAY_SETS_TO_FIRST_IMAGE',
      STUDY_TO_FIRST_IMAGE: 'STUDY_TO_FIRST_IMAGE',
      SCRIPT_TO_VIEW: 'SCRIPT_TO_VIEW',
    },
  },
}));

jest.mock('@cornerstonejs/core', () => ({
  EVENTS: {
    IMAGE_RENDERED: 'IMAGE_RENDERED',
  },
}));

describe('initViewTiming', () => {
  const mockElement = {
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  const defaultParameters = {
    element: mockElement,
  };

  const clearUnevenlyHandledViewportState = () => {
    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    imageRenderedListener({
      detail: {
        viewportStatus: 'rendered',
        element: mockElement,
      },
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error - restarting the object that will have values set by each test
    log.timingKeys = {};
  });

  it('should return early when no timing keys are set', () => {
    // @ts-expect-error - the idea is to test an invalid state
    log.timingKeys = {};

    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).not.toHaveBeenCalled();
  });

  it('should add event listener when timing keys are present', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      EVENTS.IMAGE_RENDERED,
      expect.any(Function)
    );

    clearUnevenlyHandledViewportState();
  });

  it('should handle multiple timing keys', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES] = true;
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      EVENTS.IMAGE_RENDERED,
      expect.any(Function)
    );

    clearUnevenlyHandledViewportState();
  });

  it('should return early in imageRenderedListener when viewportStatus is preRender', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {
      detail: {
        viewportStatus: 'preRender',
        element: mockElement,
      },
    };

    imageRenderedListener(evt);

    expect(log.timeEnd).not.toHaveBeenCalled();
    expect(mockElement.removeEventListener).not.toHaveBeenCalled();

    clearUnevenlyHandledViewportState();
  });

  it('should call timeEnd for timing keys when image is rendered', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {
      detail: {
        viewportStatus: 'rendered',
        element: mockElement,
      },
    };

    imageRenderedListener(evt);

    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.STUDY_TO_FIRST_IMAGE);
    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.SCRIPT_TO_VIEW);
  });

  it('should remove event listener after image is rendered', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {
      detail: {
        viewportStatus: 'rendered',
        element: mockElement,
      },
    };

    imageRenderedListener(evt);

    expect(mockElement.removeEventListener).toHaveBeenCalledWith(
      EVENTS.IMAGE_RENDERED,
      imageRenderedListener
    );
  });

  it('should not call timeEnd for ALL_IMAGES when viewports are still waiting', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);
    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {
      detail: {
        viewportStatus: 'rendered',
        element: mockElement,
      },
    };

    imageRenderedListener(evt);

    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.STUDY_TO_FIRST_IMAGE);
    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.SCRIPT_TO_VIEW);
    expect(log.timeEnd).not.toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);

    clearUnevenlyHandledViewportState();
  });

  it('should handle multiple viewports finishing in sequence', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    const mockElement2 = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };

    initViewTiming(defaultParameters);
    initViewTiming({ element: mockElement2 });

    const imageRenderedListener1 = mockElement.addEventListener.mock.calls[0][1];
    const imageRenderedListener2 = mockElement2.addEventListener.mock.calls[0][1];

    const evt1 = {
      detail: {
        viewportStatus: 'rendered',
        element: mockElement,
      },
    };

    const evt2 = {
      detail: {
        viewportStatus: 'rendered',
        element: mockElement2,
      },
    };

    imageRenderedListener1(evt1);

    expect(log.timeEnd).not.toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);

    imageRenderedListener2(evt2);

    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);
  });

  it('should call timeEnd for ALL_IMAGES when last viewport finishes', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {
      detail: {
        viewportStatus: 'rendered',
        element: mockElement,
      },
    };

    imageRenderedListener(evt);

    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES);
  });

  it('should handle different viewportStatus values', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {
      detail: {
        viewportStatus: 'loading',
        element: mockElement,
      },
    };

    imageRenderedListener(evt);

    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
    expect(mockElement.removeEventListener).toHaveBeenCalled();
  });

  it('should handle undefined viewportStatus', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {
      detail: {
        element: mockElement,
      },
    };

    imageRenderedListener(evt);

    expect(log.timeEnd).toHaveBeenCalledWith(Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE);
    expect(mockElement.removeEventListener).toHaveBeenCalled();
  });

  it('should handle missing detail object', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    const imageRenderedListener = mockElement.addEventListener.mock.calls[0][1];
    const evt = {};

    expect(() => imageRenderedListener(evt)).toThrow();
  });

  it('should handle timing keys with falsy values', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = false;
    log.timingKeys[Enums.TimingEnum.STUDY_TO_FIRST_IMAGE] = null;
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES] = undefined;

    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).not.toHaveBeenCalled();
  });

  it('should handle timing keys with truthy values', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = 'some value';
    log.timingKeys[Enums.TimingEnum.STUDY_TO_FIRST_IMAGE] = 1;
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_ALL_IMAGES] = {};

    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).toHaveBeenCalledWith(
      EVENTS.IMAGE_RENDERED,
      expect.any(Function)
    );
  });

  it('should initialize IMAGE_TIMING_KEYS on first call', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).toHaveBeenCalled();
  });

  it('should handle empty element object', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;
    const emptyElement = {};

    expect(() => initViewTiming({ element: emptyElement })).toThrow();
  });

  it('should handle null element', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    expect(() => initViewTiming({ element: null })).toThrow();
  });

  it('should handle multiple calls with same element', () => {
    log.timingKeys[Enums.TimingEnum.DISPLAY_SETS_TO_FIRST_IMAGE] = true;

    initViewTiming(defaultParameters);
    initViewTiming(defaultParameters);
    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).toHaveBeenCalledTimes(3);
  });

  it('should handle case where no timing keys match', () => {
    // @ts-expect-error - the idea is to test an invalid state
    log.timingKeys = {
      someOtherKey: true,
      anotherKey: 'value',
    };

    initViewTiming(defaultParameters);

    expect(mockElement.addEventListener).not.toHaveBeenCalled();
  });
});
