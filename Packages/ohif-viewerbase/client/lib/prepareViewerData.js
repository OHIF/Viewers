import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

/**
 * Prepare the studies data to render the viewer template
 *
 * @param {Array} studyInstanceUids List of studies that will be loaded into viewer
 * @param {Array} seriesInstanceUids List of series that will be loaded into viewer. If it is not defined, all series will be loaded
 * @param {String} timepointId ID of the current timepoint to get the studies from
 * @param {Object} timepointsFilter An object containing the filter to retrieve the timepoints
 * @return {Promise} Promise that will be resolved with the studies when the metadata is loaded
 */
export const prepareViewerData = ({ studyInstanceUids, seriesInstanceUids, timepointId, timepointsFilter={} }) => {
    // Clear the cornerstone tool data to sync the measurements with the measurements API
    cornerstoneTools.globalImageIdSpecificToolStateManager.restoreToolState({});

    // Retrieve the studies metadata
    const promise = new Promise((resolve, reject) => {
        const processData = viewerData => {
            OHIF.studies.retrieveStudiesMetadata(viewerData.studyInstanceUids, viewerData.seriesInstanceUids).then(studies => {
                // Add additional metadata to our study from the studylist
                studies.forEach(study => {
                    const studylistStudy = OHIF.studylist.collections.Studies.findOne({
                        studyInstanceUid: study.studyInstanceUid
                    });

                    if (!studylistStudy) {
                        return;
                    }

                    Object.assign(study, studylistStudy);
                });

                resolve({
                    studies,
                    viewerData
                });
            }).catch(reject);
        };

        // Check if the studies are already given and ignore the timepoint ID if so
        if (studyInstanceUids && studyInstanceUids.length) {
            const viewerData = {
                studyInstanceUids,
                seriesInstanceUids,
            };
            processData(viewerData);
        } else {
            // Find the timepoint by ID and load the studies from it
            OHIF.studylist.timepointApi.retrieveTimepoints(timepointsFilter).then(() => {
                const viewerData = buildViewerDataFromTimepointId(timepointId);
                processData(viewerData);
            }).catch(reject);
        }
    });

    return promise;
};

const buildViewerDataFromTimepointId = timepointId => {
    const timepoint = OHIF.studylist.timepointApi.timepoints.findOne({ timepointId });
    if (!timepoint) {
        throw new Error('Unable to find a time point with the given ID');
    }

    // Get the relevant studyInstanceUids given the timepoints
    const data = getDataFromTimepoint(timepoint);
    if (!data.studyInstanceUids) {
        throw new Error('No studies found that are related to this timepoint');
    }

    // Build the viewer data and return it
    return Object.assign(data, { currentTimepointId: timepointId });
};

/**
 * Retrieves related studies given a Baseline or Follow-up Timepoint
 *
 * @param {Object} timepoint A document from the Timepoints Collection
 * @returns {Object} An object containing the related studies UIDs and timepoint IDs
 */
const getDataFromTimepoint = timepoint => {
    let relatedStudies = _.clone(timepoint.studyInstanceUids);

    // If this is the baseline, we should stop here and return the relevant studies
    if (isBaseline(timepoint)) {
        return {
            studyInstanceUids: relatedStudies,
            timepointIds: [timepoint.timepointId]
        };
    }

    // Otherwise, this is a follow-up exam, so we should also find the baseline timepoint,
    // and all studies related to it. We also enforce that the Baseline should have a studyDate
    // prior to the latest studyDate in the current (Follow-up) Timepoint.
    const Timepoints = OHIF.studylist.timepointApi.timepoints;
    const baseline = Timepoints.findOne({
        timepointType: 'baseline',
        patientId: timepoint.patientId,
        latestDate: {
            $lte: timepoint.latestDate
        }
    });

    let timepointIds = [];
    if (baseline) {
        relatedStudies = relatedStudies.concat(baseline.studyInstanceUids);
        timepointIds.push(baseline.timepointId);
    } else {
        OHIF.log.warn('No Baseline found while opening a Follow-up Timepoint');
    }

    const priorFilter = { latestDate: { $lt: timepoint.latestDate } };
    const priorSorting = { sort: { latestDate: -1 } };
    const prior = OHIF.studylist.timepointApi.timepoints.findOne(priorFilter, priorSorting);
    if (prior && prior.timepointId !== baseline.timepointId) {
        relatedStudies = relatedStudies.concat(prior.studyInstanceUids);
        timepointIds.push(prior.timepointId);
    }

    relatedStudies = _.uniq(relatedStudies);

    timepointIds.push(timepoint.timepointId);

    return {
        studyInstanceUids: relatedStudies,
        timepointIds
    };
};

/**
 * Checks if a Timepoints is a baseline or not
 *
 * @param {Object} timepoint A document from the Timepoints Collection
 * @returns {boolean} Whether or not the timepoint is stored as a Baseline
 */
const isBaseline = timepoint => timepoint.timepointType === 'baseline';
