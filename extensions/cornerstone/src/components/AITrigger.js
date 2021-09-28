import { getEnabledElement } from '../state';
import cornerstone from 'cornerstone-core';
import cornerstoneTools from 'cornerstone-tools';

const TriggerAlgorithm = ({ viewports, servicesManager }) => {
  // pass all the data here and configure them
  const { UINotificationService } = servicesManager.services;

  // setting active viewport reference to element variable
  const element = getEnabledElement(viewports.activeViewportIndex);
  if (!element) {
    return;
  }

  // retriving cornerstone enable element object
  const enabled_element = cornerstone.getEnabledElement(element);
  if (!enabled_element || !enabled_element.image) {
    return;
  }

  // storing viewport to get all necessary data from cornerstone in panel element
  // localStorage.setItem('viewports', JSON.stringify(viewports));

  UINotificationService.show({ message: 'AI Algorithm Functionality Triggered' });

  // declaring cornerstone tool for getting RectangleRoi tool coordinates/ dimensions
  const toolType = 'RectangleRoi';
  const toolData = cornerstoneTools.getToolState(element, toolType);

  if (toolData) {
    UINotificationService.show({ message: 'RectangleRoi dimensions found' });
    console.log({ toolData });
  }

  if (!toolData) UINotificationService.show({ message: 'No dimensions found' });
};

export default TriggerAlgorithm;
