import React from 'react';

export default {
  'ohif.tours': [
    {
      id: 'basicViewerTour',
      route: '/viewer',
      steps: [
        {
          selector: '.viewport-element',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Scrolling Through Images</h3>
              <p>You can scroll through the images using the mouse wheel or scrollbar.</p>
            </div>
          ),
          position: 'top',
          action: (node) => {
            // Wait for element to be available
            if (node) {
              node.focus?.();
            }
          },
        },
        {
          selector: '.viewport-element',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Zooming In and Out</h3>
              <p>You can zoom the images using the right click.</p>
            </div>
          ),
          position: 'left',
        },
        {
          selector: '.viewport-element',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Panning the Image</h3>
              <p>You can pan the images using the middle click.</p>
            </div>
          ),
          position: 'top',
        },
        {
          selector: '.viewport-element',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Adjusting Window Level</h3>
              <p>You can modify the window level using the left click.</p>
            </div>
          ),
          position: 'left',
        },
        {
          selector: '[data-cy="MeasurementTools-split-button-primary"]',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Using the Measurement Tools</h3>
              <p>You can measure the length of a region using the Length tool.</p>
            </div>
          ),
          position: 'bottom',
        },
        {
          selector: '.viewport-element',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Drawing Length Annotations</h3>
              <p>Use the length tool on the viewport to measure the length of a region.</p>
            </div>
          ),
          position: 'right',
        },
        {
          selector: '[data-cy="prompt-begin-tracking-yes-btn"]',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Tracking Measurements in the Panel</h3>
              <p>Click yes to track the measurements in the measurement panel.</p>
            </div>
          ),
          position: 'bottom',
        },
        {
          selector: '#trackedMeasurements-btn',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Opening the Measurements Panel</h3>
              <p>Click the measurements button to open the measurements panel.</p>
            </div>
          ),
          position: 'left',
        },
        {
          selector: '.viewport-element',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Scrolling Away from a Measurement</h3>
              <p>Scroll the images using the mouse wheel away from the measurement.</p>
            </div>
          ),
          position: 'left',
        },
        {
          selector: '[data-cy="data-row"]',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Jumping to Measurements in the Panel</h3>
              <p>Click the measurement in the measurement panel to jump to it.</p>
            </div>
          ),
          position: 'left',
        },
        {
          selector: '[data-cy="Layout"]',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Changing Layout</h3>
              <p>You can change the layout of the viewer using the layout button.</p>
            </div>
          ),
          position: 'bottom',
        },
        {
          selector: '[data-cy="MPR"]',
          content: ({ setCurrentStep, currentStep, steps, setIsOpen }) => (
            <div>
              <h3>Selecting the MPR Layout</h3>
              <p>Select the MPR layout to view the images in MPR mode.</p>
            </div>
          ),
          position: 'left',
        },
      ],
      tourOptions: {
        // React Tours options can be added here if needed
        // These will be passed to the TourProvider when the tour is activated
      },
    },
  ],
};
