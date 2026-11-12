import { utils } from '@ohif/core';

/**
 * Formatters used to format each of the content items (SR "nodes") which can be
 * text, code, UID ref, number, person name, date, time and date time. Each
 * formatter must be a function with the following signature:
 *
 *    [VALUE_TYPE]: (contentItem) => string
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
};

function formatContentItemValue(contentItem) {
  const { ValueType } = contentItem;
  const fnFormat = contentItemFormatters[ValueType];

  return fnFormat ? fnFormat(contentItem) : `[${ValueType} is not supported]`;
}

export { formatContentItemValue as default, formatContentItemValue };
