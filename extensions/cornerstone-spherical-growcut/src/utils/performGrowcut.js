import { GrowCutGenerator, step, fields } from "ohif-step";
import * as dcmjs from "dcmjs";

const { helpers } = fields;
const { fieldsFromDataset } = helpers;

export default function performGrowCut(
  backgroundDataset,
  labelmapDataset,
  maxIterations = 50
) {
  console.log("starting performGrowCut");

  // TODO: This doesn't work for one slice for some reason.

  const backgroundField = fieldsFromDataset(backgroundDataset)[0];

  step.renderer.reset();

  step.renderer.inputFields.push(backgroundField);
  step.renderer.updateProgram();

  const labelFields = [];
  const strengthFields = [];

  [0, 1].forEach(index => {
    const derivedImage = new dcmjs.derivations.DerivedImage([
      backgroundField.dataset
    ]);
    const labelField = fieldsFromDataset(derivedImage.dataset)[0];
    const strengthField = fieldsFromDataset(derivedImage.dataset)[0];

    labelFields.push(labelField);
    strengthFields.push(strengthField);

    step.renderer.inputFields.push(labelField);
    step.renderer.inputFields.push(strengthField);

    console.log("added field", index);
  });

  labelFields[0] = fieldsFromDataset(labelmapDataset)[0];
  // Step.renderer.inputFields[1] = Field.fromDataset(labelmapDataset)[0]

  // TODO: don't need to upload texture of generated fields
  step.renderer.updateProgram();
  console.log("updated program");

  backgroundField.visible = 0;
  const iterations = maxIterations;
  let iteration = 0;

  const animationFrame = function() {
    const inBuffer = iteration % 2;
    const outBuffer = (iteration + 1) % 2;

    step.growcut.uniforms.iteration.value = iteration;
    labelFields[inBuffer].visible = 0;
    strengthFields[inBuffer].visible = 0;
    labelFields[outBuffer].visible = 1;
    strengthFields[outBuffer].visible = 0;

    console.log(iteration, "generating");

    step.growcut.inputFields = [
      backgroundField,
      labelFields[inBuffer],
      strengthFields[inBuffer]
    ];
    step.growcut.outputFields = [
      labelFields[outBuffer],
      strengthFields[outBuffer]
    ];

    // For the final iteration, save the calculation result to CPU
    if (iteration === iterations - 1) {
      // Outputfields[0] is the labelmap, 1 is the strength
      step.growcut.outputFields.forEach(outputField => {
        outputField.generatedPixelData = new ArrayBuffer(
          outputField.dataset.PixelData.byteLength
        );
        // OutputField.generatedPixelData = outputField.dataset.PixelData
      });
    }
    console.log(step.growcut.uniforms.iteration.value);
    step.growcut.generate();

    console.log(iteration, "rendering");
    step.renderer._render();
    iteration++;
    if (iteration < iterations) {
      // Not finished, trigger another itertion
      console.log(`Iteration ${iteration} of ${iterations}`);
    } else {
      console.log(`Finished ${iterations} iterations`);
      [0, 1].forEach(index => {
        labelFields[index].visible = 0;
        strengthFields[index].visible = 0;
      });
      backgroundField.visible = 1;
      labelFields[outBuffer].visible = 1;
      step.renderer._render();
      console.log("finished");
    }
  };

  _initialiseGrowcut(iterations, labelFields, strengthFields, backgroundField);

  for (let i = 0; i < iterations; i++) {
    animationFrame();
  }

  step.renderer.requestRender(step.view);

  const outputFields = step.growcut.outputFields;

  return new Uint16Array(outputFields[0].generatedPixelData);
}

function _initialiseGrowcut(
  iterations,
  labelFields,
  strengthFields,
  backgroundField
) {
  const inBuffer = 0;
  const outBuffer = 1;

  step.growcut = new GrowCutGenerator({
    gl: step.renderer.gl
  });

  step.growcut.uniforms.iterations.value = iterations;
  step.growcut.inputFields = [
    backgroundField,
    labelFields[inBuffer],
    strengthFields[inBuffer]
  ];

  step.growcut.outputFields = [
    labelFields[outBuffer],
    strengthFields[outBuffer]
  ];
  step.growcut.updateProgram();
}
