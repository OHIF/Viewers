import Length from './Length';
import EllipticalRoi from './EllipticalRoi';
import RectangleRoi from './rectangleRoi';
import SimpleAngle from './SimpleAngle';
import ArrowAnnotate from './ArrowAnnotate';

const trackedTools = [
  Length,
  EllipticalRoi,
  RectangleRoi,
  SimpleAngle,
  ArrowAnnotate
];

export default [
  {
    id: 'allTools',
    name: 'Measurements',
    childTools: trackedTools
  }
];
