import d3SVGToPNG from './d3SVGToPNG';
import setScreenshot from '../screenshots';

export default function saveEvaluatePlotScreenshot(targetMeasurementNumber) {
  // // Update the png image.
  d3SVGToPNG('.d3-component', 'png', {
    download: true,
  }).then(data => {
    setScreenshot(targetMeasurementNumber, data);
  });
}
