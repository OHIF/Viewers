import length from './length';
import ellipticalRoi from './ellipticalRoi';
import rectangleRoi from './rectangleRoi';
import simpleAngle from './simpleAngle';
import arrowAnnotate from './arrowAnnotate';

const trackedTools = [
  length,
  ellipticalRoi,
  rectangleRoi,
  simpleAngle,
  arrowAnnotate
];

export default [
  {
    id: 'allTools',
    name: 'Measurements',
    childTools: trackedTools
  }
];
