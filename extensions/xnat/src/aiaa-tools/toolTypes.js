import AIAA_MODEL_TYPES from './modelTypes';

const TOOL_TYPES = [
  {
    type: AIAA_MODEL_TYPES.ANNOTATION,
    name: 'Annotation',
    desc: 'DExtr3D-based annotation. Generally more accurate but requires ' +
      'user to provide extreme points (6+ points) to annotate an organ.',
  },
  {
    type: AIAA_MODEL_TYPES.DEEPGROW,
    name: 'DeepGrow',
    desc: 'DeepGrow tool assists to annotate any organ. ' +
      'Use Ctrl + Click to add background points.',
  },
  {
    type: AIAA_MODEL_TYPES.SEGMENTATION,
    name: 'Segmentation',
    desc: 'Fully automated segmentation without user input. Just select a ' +
      'segmentation model and then click run.',
  },
];

export default TOOL_TYPES;