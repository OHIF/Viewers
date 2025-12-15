import formatDICOMPatientName from './formatDICOMPatientName';
import { formatDICOMDate } from '@ohif/ui-next';
import formatDICOMTime from './formatDICOMTime';
import formatNumberPrecision from './formatNumberPrecision';
import isValidNumber from './isValidNumber';

const helpers = {
  formatDICOMPatientName,
  formatDICOMDate,
  formatDICOMTime,
  formatNumberPrecision,
  isValidNumber,
};

export default helpers;
