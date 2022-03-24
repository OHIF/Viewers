import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import preMouseDownCallback from './preMouseDownCallback';

const { CircleScissorsTool } = csTools;

export default class XNATCircleScissorsTool extends CircleScissorsTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.XNAT_CIRCLE_SCISSORS_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }

  preMouseDownCallback(evt) {
    const { detail } = evt;

    preMouseDownCallback(detail.element);

    const { event } = detail;
    if (event.ctrlKey) {
      this.activeStrategy = 'ERASE_INSIDE';
    } else {
      this.activeStrategy = 'FILL_INSIDE';
    }
  }
}
