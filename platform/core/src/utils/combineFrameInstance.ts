import { vec3 } from 'gl-matrix';
import dcmjs from '@dcmjs-org/dcmjs';
import { dicomSplit } from './dicomSplit';

/** The position moved by `offset` along the normal of `orientation`, or undefined. */
function offsetPosition(position, orientation, offset) {
  if (!position || !orientation || !Number.isFinite(offset)) {
    return;
  }
  const [r0, r1, r2, c0, c1, c2] = orientation.map(Number);
  const normal = vec3.cross(vec3.create(), [r0, r1, r2], [c0, c1, c2]);
  const result = vec3.scaleAndAdd(vec3.create(), position.map(Number), normal, offset);
  return [result[0], result[1], result[2]];
}

/**
 * The modality fallbacks of the frame geometry:
 * - NM: the orientation and the position of each frame from DetectorInformationSequence
 *   and SpacingBetweenSlices.
 * - RTDOSE: the position of each frame from GridFrameOffsetVector.
 * - Otherwise a frame with no position gets `[0, 0, frameNumber]`.
 */
function frameAttributes(view, { dataset, frameNumber }) {
  const attributes: Record<string, unknown> = {};
  const detector = dataset.DetectorInformationSequence?.[0];
  if (!view.ImageOrientationPatient && detector?.ImageOrientationPatient) {
    attributes.ImageOrientationPatient = detector.ImageOrientationPatient;
  }
  const orientation = attributes.ImageOrientationPatient ?? view.ImageOrientationPatient;
  const spacing = Number(dataset.SpacingBetweenSlices) || NaN;
  const position = view.ImagePositionPatient
    ? (offsetPosition(
        view.ImagePositionPatient,
        orientation,
        Number(dataset.GridFrameOffsetVector?.[frameNumber - 1])
      ) ?? view.ImagePositionPatient)
    : offsetPosition(detector?.ImagePositionPatient, orientation, spacing * (frameNumber - 1));
  attributes.ImagePositionPatient = position ?? [0, 0, frameNumber];
  return attributes;
}

/** `frameNumber` is a runtime property: dcmjs serialization and spreads skip it. */
const frameProperties = (_view, { frameNumber }) => ({ frameNumber });

const frameOptions = { frameAttributes, frameProperties, privateMacros: true };

/**
 * The view of one frame of a multi-frame instance, from `dcmjs.data.frameDataset`:
 * the per-frame functional groups, then the shared functional groups, then the root.
 * A single frame instance comes back unchanged. The views are cached on the instance.
 *
 * Note: instances carry non-enumerable runtime props (frameNumber, imageId,
 * url, wadoRoot, ...). This is intentional: dcmjs serialization skips them and
 * spreads/copies (including of anything from `metaData.get('instance', ...)`)
 * deliberately do not carry them — frameNumber in particular must not be
 * copied onto other objects. Read runtime props off the original instance.
 */
const combineFrameInstance = (frame, instance) => {
  if (instance.NumberOfFrames < 2) {
    return instance;
  }
  instance.ImageType = dicomSplit(instance.ImageType);
  return dcmjs.data.frameDataset(instance, Number.parseInt(frame || 1), frameOptions);
};

export default combineFrameInstance;
