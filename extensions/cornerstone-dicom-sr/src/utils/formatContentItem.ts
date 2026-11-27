import { utils } from '@ohif/core';

/**
 * Formatters used to format each of the content items (SR "nodes") which can be
 * text, code, UID ref, number, person name, date, time, date time and image
 * reference. Each formatter must be a function with the following signature:
 *
 *    [VALUE_TYPE]: (contentItem, displaySetService?) => string
 *
 */
const contentItemFormatters = {
  TEXT: contentItem => contentItem.TextValue,
  CODE: contentItem => contentItem.ConceptCodeSequence?.[0]?.CodeMeaning,
  UIDREF: contentItem => contentItem.UID,
  NUM: contentItem => {
    const measuredValue = contentItem.MeasuredValueSequence?.[0];

    if (!measuredValue) {
      return;
    }

    const { NumericValue, MeasurementUnitsCodeSequence } = measuredValue;
    const { CodeValue } = MeasurementUnitsCodeSequence;

    return `${NumericValue} ${CodeValue}`;
  },
  PNAME: contentItem => {
    const personName = contentItem.PersonName?.[0];
    return personName ? utils.formatPN(personName) : undefined;
  },
  DATE: contentItem => {
    const { Date } = contentItem;
    return Date ? utils.formatDate(Date) : undefined;
  },
  TIME: contentItem => {
    const { Time } = contentItem;
    return Time ? utils.formatTime(Time) : undefined;
  },
  DATETIME: contentItem => {
    const { DateTime } = contentItem;

    if (typeof DateTime !== 'string') {
      return;
    }

    // 14 characters because it should be something like 20180614113714
    if (DateTime.length < 14) {
      return DateTime;
    }

    const dicomDate = DateTime.substring(0, 8);
    const dicomTime = DateTime.substring(8, 14);
    const formattedDate = utils.formatDate(dicomDate);
    const formattedTime = utils.formatTime(dicomTime);

    return `${formattedDate} ${formattedTime}`;
  },
  // Names the referenced image by its series and instance number, as found among the
  // loaded display sets.
  IMAGE: (contentItem, displaySetService) => {
    const sopInstanceUID = contentItem.ReferencedSOPSequence?.[0]?.ReferencedSOPInstanceUID;

    for (const displaySet of displaySetService?.getActiveDisplaySets() ?? []) {
      const instance = displaySet.instances?.find(i => i.SOPInstanceUID === sopInstanceUID);

      if (instance) {
        const frames = instance.NumberOfFrames > 1 ? `, ${instance.NumberOfFrames} frames` : '';
        return `Series ${instance.SeriesNumber}, image ${instance.InstanceNumber}${frames}`;
      }
    }

    return '[referenced image not loaded]';
  },
};

function formatContentItemValue(contentItem, displaySetService?) {
  const { ValueType } = contentItem;
  const fnFormat = contentItemFormatters[ValueType];

  return fnFormat ? fnFormat(contentItem, displaySetService) : `[${ValueType} is not supported]`;
}

export { formatContentItemValue as default, formatContentItemValue };
