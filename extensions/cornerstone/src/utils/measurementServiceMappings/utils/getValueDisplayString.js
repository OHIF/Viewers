import { utils } from '@ohif/core';
import getDisplayUnit from './getDisplayUnit';

export const getStatisticDisplayString = (numbers, unit, key) => {
  // 只允许显示 area、mean 和 label 这三个参数
  const allowedKeys = ['area', 'mean', 'label'];

  if (!allowedKeys.includes(key.toLowerCase())) {
    return '';
  }

  if (Array.isArray(numbers) && numbers.length > 0) {
    const results = numbers.map(number => utils.roundNumber(number, 2));
    return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${results.join(', ')} <small>${getDisplayUnit(unit)}</small>`;
  }

  const result = utils.roundNumber(numbers, 2);
  return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${result} <small>${getDisplayUnit(unit)}</small>`;
};
