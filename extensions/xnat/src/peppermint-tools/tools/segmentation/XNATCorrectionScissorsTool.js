import csTools from 'cornerstone-tools';
import TOOL_NAMES from '../../toolNames';
import preMouseDownCallback from './preMouseDownCallback';

/*
 *  Operation using a modification of the Tobias Heimann Correction Algorithm:
 *  The algorithm is described in full length in Tobias Heimann's diploma thesis (MBI Technical Report 145, p. 37 - 40).
 */

const { CorrectionScissorsTool } = csTools;

export default class XNATCircleScissorsTool extends CorrectionScissorsTool {
  constructor(props = {}) {
    const defaultProps = {
      name: TOOL_NAMES.XNAT_CORRECTION_SCISSORS_TOOL,
    };

    const initialProps = Object.assign(defaultProps, props);
    super(initialProps);
  }

  preMouseDownCallback(evt) {
    const { detail } = evt;

    preMouseDownCallback(detail.element);
  }
}
