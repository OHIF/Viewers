import { StepOptions, TourOptions } from 'shepherd.js';

const tours = {
  route: '/viewer',
  steps: [
    {
      id: 'scroll',
      text: 'You can scroll through the images using the mouse wheel.',
      attachTo: {
        element: '.viewport-element',
        on: 'left-start',
      },
    },
    {
      id: 'zoom',
      text: 'You can zoom the images using the right click.',
      attachTo: {
        element: '.viewport-element',
        on: 'left-start',
      },
    },
    {
      id: 'pan',
      text: 'You can pan the images using the middle click.',
      attachTo: {
        element: '.viewport-element',
        on: 'left-start',
      },
    },
    {
      id: 'windowing',
      text: 'You can modify the window level using the left click.',
      attachTo: {
        element: '.viewport-element',
        on: 'left-start',
      },
    },
    {
      id: 'length',
      text: 'You can measure the length of a region using the Length tool.',
      attachTo: {
        element: '.MeasurementTools-split-button-primary',
        on: 'bottom',
      },
    },
    {
      id: 'drawAnnotation',
      text: 'Use the length tool on the viewport to measure the length of a region.',
      attachTo: {
        element: '.viewport-element',
        on: 'left-start',
      },
    },
    {
      id: 'trackMeasurement',
      text: 'Click yes to track the measurements in the measurement panel.',
      attachTo: {
        element: '[data-cy="prompt-begin-tracking-yes-btn"]',
        on: 'bottom',
      },
    },
    {
      id: 'openMeasurementPanel',
      text: 'Click the measurements button to open the measurements panel.',
      attachTo: {
        element: '#trackedMeasurements-btn',
        on: 'left-start',
      },
    },
    {
      id: 'scrollAwayFromMeasurement',
      text: 'Scroll the images using the mouse wheel away from the measurement.',
      attachTo: {
        element: '.viewport-element',
        on: 'left-start',
      },
    },
    {
      id: 'jumpToMeasurement',
      text: 'Click the measurement in the measurement panel to jump to it.',
      attachTo: {
        element: '[data-cy="measurement-item"]',
        on: 'left-start',
      },
    },
    {
      id: 'changeLayout',
      text: 'You can change the layout of the viewer using the layout button.',
      attachTo: {
        element: '[data-cy="Layout"]',
        on: 'bottom',
      },
    },
    {
      id: 'selectLayout',
      text: 'Select the MPR layout to view the images in MPR mode.',
      attachTo: {
        element: '[data-cy="MPR"]',
        on: 'left-start',
      },
    },
  ] as StepOptions[],
  tourOptions: {} as TourOptions,
};

export { tours };
