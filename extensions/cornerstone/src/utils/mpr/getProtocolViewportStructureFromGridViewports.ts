/**
 * Given the ViewportGridService state it will re create the protocol viewport structure
 * that was used at the hanging protocol creation time. This is used to re create the
 * viewport structure when the user decides to go back to a previous cached
 * layout in the viewport grid.
 *
 *
 * viewportGrid's viewports look like
 *
 * viewports = [
 *  {
 *   displaySetInstanceUIDs: string[],
 *   displaySetOptions: [],
 *   viewportOptions: {}
 *   height: number,
 *   width: number,
 *   x: number,
 *   y: number
 *  },
 * ]
 *
 * and hanging protocols viewport structure looks like
 *
 * viewportStructure: {
 *   layoutType: 'grid',
 *   properties: {
 *       rows: 3,
 *       columns: 4,
 *       layoutOptions: [
 *         {
 *           x: 0,
 *           y: 0,
 *           width: 1 / 4,
 *           height: 1 / 3,
 *         },
 *         {
 *           x: 1 / 4,
 *           y: 0,
 *           width: 1 / 4,
 *           height: 1 / 3,
 *         },
 *       ],
 *     },
 *   },
 */
export default function getProtocolViewportStructureFromGridViewports({
  numRows,
  numCols,
  viewports,
}: {
  numRows: number;
  numCols: number;
  viewports: any[];
}) {
  const viewportStructure = {
    layoutType: 'grid',
    properties: {
      rows: numRows,
      columns: numCols,
      layoutOptions: [],
    },
  };

  viewports.forEach(viewport => {
    viewportStructure.properties.layoutOptions.push({
      x: viewport.x,
      y: viewport.y,
      width: viewport.width,
      height: viewport.height,
    });
  });

  return viewportStructure;
}
