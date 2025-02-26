import { utils } from '@ohif/core';
import getDisplayUnit from './getDisplayUnit';

export const getStatisticDisplayString = (numbers, unit, key) => {
  if (Array.isArray(numbers) && numbers.length > 0) {
    const results = numbers.map(number => utils.roundNumber(number, 2));
    return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${results.join(', ')} ${getDisplayUnit(unit)}`;
  }

  const result = utils.roundNumber(numbers, 2);
  return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${result} ${getDisplayUnit(unit)}`;
};
