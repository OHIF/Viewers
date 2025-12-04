import i18n from '@ohif/i18n';

function waitForElement(selector, maxAttempts = 20, interval = 25) {
  return new Promise(resolve => {
    let attempts = 0;

    const checkForElement = setInterval(() => {
      const element = document.querySelector(selector);

      if (element || attempts >= maxAttempts) {
        clearInterval(checkForElement);
        resolve();
      }

      attempts++;
    }, interval);
  });
}

export default {
  'ohif.tours': [
    {
      id: 'basicViewerTour',
      route: '/viewer',
      steps: [
        {
          id: 'scroll',
          title: i18n.t('Onboarding:Scrolling Through Images'),
          text: i18n.t('Onboarding:You can scroll through the images using the mouse wheel or scrollbar.'),
          attachTo: {
            element: '.viewport-element',
            on: 'top',
          },
          advanceOn: {
            selector: '.cornerstone-viewport-element',
            event: 'CORNERSTONE_TOOLS_MOUSE_WHEEL',
          },
          beforeShowPromise: () => waitForElement('.viewport-element'),
        },
        {
          id: 'zoom',
          title: i18n.t('Onboarding:Zooming In and Out'),
          text: i18n.t('Onboarding:You can zoom the images using the right click.'),
          attachTo: {
            element: '.viewport-element',
            on: 'left',
          },
          advanceOn: {
            selector: '.cornerstone-viewport-element',
            event: 'CORNERSTONE_TOOLS_MOUSE_UP',
          },
          beforeShowPromise: () => waitForElement('.viewport-element'),
        },
        {
          id: 'pan',
          title: i18n.t('Onboarding:Panning the Image'),
          text: i18n.t('Onboarding:You can pan the images using the middle click.'),
          attachTo: {
            element: '.viewport-element',
            on: 'top',
          },
          advanceOn: {
            selector: '.cornerstone-viewport-element',
            event: 'CORNERSTONE_TOOLS_MOUSE_UP',
          },
          beforeShowPromise: () => waitForElement('.viewport-element'),
        },
        {
          id: 'windowing',
          title: i18n.t('Onboarding:Adjusting Window Level'),
          text: i18n.t('Onboarding:You can modify the window level using the left click.'),
          attachTo: {
            element: '.viewport-element',
            on: 'left',
          },
          advanceOn: {
            selector: '.cornerstone-viewport-element',
            event: 'CORNERSTONE_TOOLS_MOUSE_UP',
          },
          beforeShowPromise: () => waitForElement('.viewport-element'),
        },
        {
          id: 'length',
          title: i18n.t('Onboarding:Using the Measurement Tools'),
          text: i18n.t('Onboarding:You can measure the length of a region using the Length tool.'),
          attachTo: {
            element: '[data-cy="MeasurementTools-split-button-primary"]',
            on: 'bottom',
          },
          advanceOn: {
            selector: '[data-cy="MeasurementTools-split-button-primary"]',
            event: 'click',
          },
          beforeShowPromise: () =>
            waitForElement('[data-cy="MeasurementTools-split-button-primary"]'),
        },
        {
          id: 'drawAnnotation',
          title: i18n.t('Onboarding:Drawing Length Annotations'),
          text: i18n.t('Onboarding:Use the length tool on the viewport to measure the length of a region.'),
          attachTo: {
            element: '.viewport-element',
            on: 'right',
          },
          advanceOn: {
            selector: 'body',
            event: 'event::measurement_added',
          },
          beforeShowPromise: () => waitForElement('.viewport-element'),
        },
        {
          id: 'trackMeasurement',
          title: i18n.t('Onboarding:Tracking Measurements in the Panel'),
          text: i18n.t('Onboarding:Click yes to track the measurements in the measurement panel.'),
          attachTo: {
            element: '[data-cy="prompt-begin-tracking-yes-btn"]',
            on: 'bottom',
          },
          advanceOn: {
            selector: '[data-cy="prompt-begin-tracking-yes-btn"]',
            event: 'click',
          },
          beforeShowPromise: () => waitForElement('[data-cy="prompt-begin-tracking-yes-btn"]'),
        },
        {
          id: 'openMeasurementPanel',
          title: i18n.t('Onboarding:Opening the Measurements Panel'),
          text: i18n.t('Onboarding:Click the measurements button to open the measurements panel.'),
          attachTo: {
            element: '#trackedMeasurements-btn',
            on: 'left-start',
          },
          advanceOn: {
            selector: '#trackedMeasurements-btn',
            event: 'click',
          },
          beforeShowPromise: () => waitForElement('#trackedMeasurements-btn'),
        },
        {
          id: 'scrollAwayFromMeasurement',
          title: i18n.t('Onboarding:Scrolling Away from a Measurement'),
          text: i18n.t('Onboarding:Scroll the images using the mouse wheel away from the measurement.'),
          attachTo: {
            element: '.viewport-element',
            on: 'left',
          },
          advanceOn: {
            selector: '.cornerstone-viewport-element',
            event: 'CORNERSTONE_TOOLS_MOUSE_WHEEL',
          },
          beforeShowPromise: () => waitForElement('.viewport-element'),
        },
        {
          id: 'jumpToMeasurement',
          title: i18n.t('Onboarding:Jumping to Measurements in the Panel'),
          text: i18n.t('Onboarding:Click the measurement in the measurement panel to jump to it.'),
          attachTo: {
            element: '[data-cy="data-row"]',
            on: 'left-start',
          },
          advanceOn: {
            selector: '[data-cy="data-row"]',
            event: 'click',
          },
          beforeShowPromise: () => waitForElement('[data-cy="data-row"]'),
        },
        {
          id: 'changeLayout',
          title: i18n.t('Onboarding:Changing Layout'),
          text: i18n.t('Onboarding:You can change the layout of the viewer using the layout button.'),
          attachTo: {
            element: '[data-cy="Layout"]',
            on: 'bottom',
          },
          advanceOn: {
            selector: '[data-cy="Layout"]',
            event: 'click',
          },
          beforeShowPromise: () => waitForElement('[data-cy="Layout"]'),
        },
        {
          id: 'selectLayout',
          title: i18n.t('Onboarding:Selecting the MPR Layout'),
          text: i18n.t('Onboarding:Select the MPR layout to view the images in MPR mode.'),
          attachTo: {
            element: '[data-cy="MPR"]',
            on: 'left-start',
          },
          advanceOn: {
            selector: '[data-cy="MPR"]',
            event: 'click',
          },
          beforeShowPromise: () => waitForElement('[data-cy="MPR"]'),
        },
      ],
      tourOptions: {
        useModalOverlay: true,
        defaultStepOptions: {
          buttons: [
            {
              text: i18n.t('Onboarding:Skip all'),
              action() {
                this.complete();
              },
              secondary: true,
            },
          ],
        },
      },
    },
  ],
};
