import { ViewportGridService } from '../services';

/**
 * Given the viewport grid service, determine the number of (visible) panes.
 * This function accounts for the face that offscreen viewports are maintained
 * and grid cells might be spanned/combined (e.g. for TMTV).
 *
 * @param viewportGridService the viewport grid service.
 */
const getNumViewportPanes = (
  viewportGridService: ViewportGridService
): number => {
  const { numCols, numRows, viewports } = viewportGridService.getState();
  return Math.min(viewports.length, numCols * numRows);
};

export default getNumViewportPanes;
