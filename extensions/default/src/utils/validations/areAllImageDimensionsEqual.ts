import { utils } from '@ohif/core';

const { toNumber } = utils;

/**
 * Check if the frames in a series has different dimensions
 * @param {*} instances
 * @returns
 */
export default function areAllImageDimensionsEqual(instances: Array<any>): boolean {
  if (!instances?.length) {
    return false;
  }
  const firstImage = instances[0];
  const firstImageRows = toNumber(firstImage.Rows);
  const firstImageColumns = toNumber(firstImage.Columns);

  for (let i = 1; i < instances.length; i++) {
    const instance = instances[i];
    const { Rows, Columns } = instance;

    if (toNumber(Rows) !== firstImageRows || toNumber(Columns) !== firstImageColumns) {
      return false;
    }
  }
  return true;
}
