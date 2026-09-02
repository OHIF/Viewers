import { utils } from '@ohif/core';

const { getSeriesDateTime } = utils;

/**
 * Named sources for the study browser thumbnail detail items, so an item can
 * say where to get its value from without supplying a function - which is what
 * lets the whole thing be declared as data in a `?customization=` JSONC file.
 *
 * An item may name one of these as `source`, or supply its own `contentF`.
 */
export const thumbnailDetailSources = {
  seriesNumber: ({ displaySet }) => displaySet?.SeriesNumber,

  numInstances: ({ displaySet }) =>
    (displaySet?.numImageFrames ?? displaySet?.instances?.length) || 1,

  seriesDate: ({ displaySet, formatters }) => formatters.formatDate(displaySet?.SeriesDate),

  /**
   * When the display set was created, which is the date/time the series list is
   * sorted by - see `getSeriesDateTime`.  Without this on the thumbnail, several
   * reports or segmentations saved on the same day all read as the same date and
   * their order looks arbitrary.
   *
   * Nothing below minutes is shown: the second a report was written says nothing
   * a reader can use, and it is not reliably recorded either.
   */
  instanceDateTime: ({ displaySet, instance, formatters }) => {
    const { SeriesDate, SeriesTime } = getSeriesDateTime(instance ?? displaySet);
    if (!SeriesDate) {
      return '';
    }
    const date = formatters.formatDate(SeriesDate);
    return SeriesTime ? `${date} ${formatters.formatTime(SeriesTime, 'HH:mm')}` : date;
  },
};

/**
 * Named tests for the study browser thumbnail detail items, so an item can say
 * whether to include itself without supplying a function.
 *
 * An item may name one of these as `condition`, or supply its own function.
 */
export const thumbnailDetailTests = {
  /** SR, SEG, RTSTRUCT, PMAP and the other derived display sets. */
  isDerivedDisplaySet: ({ displaySet }) => !!displaySet?.isDerivedDisplaySet,
};

export default {
  'studyBrowser.thumbnailDetailSources': thumbnailDetailSources,
  'studyBrowser.thumbnailDetailTests': thumbnailDetailTests,

  /**
   * The items shown on the detail line of a study browser thumbnail, under the
   * modality and series description.  Declared the same way as the viewport
   * overlay items (`viewportOverlay.topLeft` and friends):
   *
   * - `id` names the item, and is what an override replaces or removes.
   * - `condition` decides whether to include it, either as a function of
   *   `{ displaySet, instance, formatters }` or the name of a
   *   `studyBrowser.thumbnailDetailTests` entry.  Omitted means always.
   * - the value comes from `contentF` (a function of the same properties),
   *   `source` (the name of a `studyBrowser.thumbnailDetailSources` entry) or
   *   `attribute` (an attribute of the instance the display set shows).  An item
   *   with no value is left out.
   * - `label` prefixes the value, `title` is its tooltip, and `iconName` puts an
   *   icon before it - a name, or a function returning one.
   *
   * The default is the series number and the instance count, as the thumbnails
   * have always shown.  `platform/app/public/customizations/studyBrowser/
   * derivedDateTime.jsonc` is an example of adding to it.
   */
  'studyBrowser.thumbnailDetails': [
    {
      id: 'SeriesNumber',
      label: 'S:',
      source: 'seriesNumber',
    },
    {
      id: 'InstanceCount',
      source: 'numInstances',
      iconName: ({ displaySet }) => displaySet?.countIcon || 'InfoSeries',
    },
  ],
};
