import { Types, DisplaySetService, utils } from '@ohif/core';

import { id } from '../id';

type InstanceMetadata = Types.InstanceMetadata;

const SOPClassHandlerName = 'chart';

const CHART_MODALITY = 'CHT';

/** The private SOP class UID of chart data. */
export const ChartDataSOPClassUid = '1.9.451.13215.7.3.2.7.6.1';

const sopClassUids = [ChartDataSOPClassUid];

/**
 * The chart fields of a display set that shows `instance`. Shared by the
 * legacy builder and {@link extendChartDisplaySet}.
 */
const getChartFields = (instance, sopClassUids) => {
  const { SOPInstanceUID, SeriesDescription, SeriesNumber, SOPClassUID } = instance;

  // The date/time of a display set is the date/time of the instance it shows,
  // chosen from all the attributes that instance carries.
  const { SeriesDate, SeriesTime } = utils.getLatestInstanceDateTime(instance);

  return {
    Modality: CHART_MODALITY,
    loading: false,
    isReconstructable: false,
    SeriesDescription,
    SeriesNumber,
    SeriesDate,
    SeriesTime,
    SOPInstanceUID,
    SOPClassHandlerId: `${id}.sopClassHandlerModule.${SOPClassHandlerName}`,
    SOPClassUID,
    isDerivedDisplaySet: true,
    isLoaded: true,
    sopClassUids,
    instance,
  };
};

const makeChartDataDisplaySet = (instance, sopClassUids) => {
  const { StudyInstanceUID, SeriesInstanceUID } = instance;

  return {
    ...getChartFields(instance, sopClassUids),
    displaySetInstanceUID: utils.guid(),
    SeriesInstanceUID,
    StudyInstanceUID,
    instances: [instance],

    /**
     * Adds instances to the chart displaySet, rather than creating a new one
     * when user moves to a different workflow step and gets back to a step that
     * recreates the chart
     */
    addInstances: function (instances: InstanceMetadata[], _displaySetService: DisplaySetService) {
      this.instances.push(...instances);
      this.instance = this.instances[this.instances.length - 1];
      // The date/time shown and sorted by is that of the instance the display
      // set shows, so it moves with that instance rather than staying on the
      // one the chart was first created with.
      const { SeriesDate, SeriesTime } = utils.getLatestInstanceDateTime(this.instance);
      this.SeriesDate = SeriesDate;
      this.SeriesTime = SeriesTime;

      return this;
    },
  };
};

/**
 * Adds the chart fields to a display set that a split rule with the `chart`
 * handler made. The display set holds a revision chain, and shows the instance
 * `activeSopInstanceUid` names, else the last one, as `addInstances` does for
 * the legacy display set. An update chooses again.
 */
function extendChartDisplaySet(displaySet) {
  const { instances, activeSopInstanceUid } = displaySet;
  const active =
    instances.find(instance => instance.SOPInstanceUID === activeSopInstanceUid) ??
    instances[instances.length - 1];
  Object.assign(displaySet, getChartFields(active, getSopClassUids(instances)));
}

function getSopClassUids(instances) {
  const uniqueSopClassUidsInSeries = new Set();
  instances.forEach(instance => {
    uniqueSopClassUidsInSeries.add(instance.SOPClassUID);
  });
  const sopClassUids = Array.from(uniqueSopClassUidsInSeries);

  return sopClassUids;
}

function _getDisplaySetsFromSeries(instances) {
  // If the series has no instances, stop here
  if (!instances || !instances.length) {
    throw new Error('No instances were provided');
  }

  const sopClassUids = getSopClassUids(instances);
  const displaySets = instances.map(instance => {
    if (instance.Modality === CHART_MODALITY) {
      return makeChartDataDisplaySet(instance, sopClassUids);
    }

    throw new Error('Unsupported modality');
  });

  return displaySets;
}

const chartHandler = {
  name: SOPClassHandlerName,
  sopClassUids,
  handlerNames: ['chart'],
  extendDisplaySet: extendChartDisplaySet,
  getDisplaySetsFromSeries: instances => {
    return _getDisplaySetsFromSeries(instances);
  },
};

export { chartHandler };
