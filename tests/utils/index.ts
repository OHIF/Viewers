import { visitStudy } from './visitStudy';
import { checkForScreenshot } from './checkForScreenshot';
import { screenShotPaths } from './screenShotPaths';
import {
  simulateClicksOnElement,
  simulateDoubleClickOnElement,
  simulateNormalizedClickOnElement,
  simulateNormalizedClicksOnElement,
} from './simulateClicksOnElement';
import { simulateNormalizedDragOnElement } from './simulateDragOnElement';
import { reduce3DViewportSize } from './reduce3DviewportSize';
import { getMousePosition, initializeMousePositionTracker } from './mouseUtils';
import { getSUV } from './getSUV';
import { getTMTVModalityUnit } from './getTMTVModalityUnit';
import { clearAllAnnotations } from './clearAllAnnotations';
import { scrollVolumeViewport } from './scrollVolumeViewport';
import { attemptAction } from './attemptAction';
import { addLengthMeasurement } from './addLengthMeasurement';
import { test, expect } from './fixture';

export {
  visitStudy,
  checkForScreenshot,
  screenShotPaths,
  simulateClicksOnElement,
  simulateDoubleClickOnElement,
  simulateNormalizedClickOnElement,
  simulateNormalizedClicksOnElement,
  simulateNormalizedDragOnElement,
  reduce3DViewportSize,
  getMousePosition,
  initializeMousePositionTracker,
  getSUV,
  getTMTVModalityUnit,
  clearAllAnnotations,
  scrollVolumeViewport,
  attemptAction,
  addLengthMeasurement,
  test,
  expect,
};
