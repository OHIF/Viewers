import { Session } from 'meteor/session';
import { OHIF } from 'meteor/ohif:core';
// @TODO: import symbols into local scope: Studies and ViewerData

const getStudyFromStudyInstanceUid = studyInstanceUid => {
    // @TypeSafeStudies
    return Studies.findBy({ studyInstanceUid });
};

const getNumberOfStacks = studyInstanceUid => {
    // May not work if the Study contains non-image series?
    const study = getStudyFromStudyInstanceUid(studyInstanceUid);

    if (!study || !study.series || !study.series.length) {
      return;
    }

    return study.series.length;
};

const getActiveViewportIndex = () => {
    return Session.get('activeViewport');
};

const loadSeries = indexCalculator => {
    if(typeof indexCalculator !== 'function') {
      return;
    }

    const viewportIndex = getActiveViewportIndex();
    const contentId = Session.get('activeContentId');
    const viewerData = ViewerData[contentId].loadedSeriesData[viewportIndex];

    if(!viewerData && !viewerData.studyInstanceUid) {
      return;
    }

    const { studyInstanceUid, seriesInstanceUid, displaySetInstanceUid } = viewerData;

    if(!studyInstanceUid) {
      return;
    }

    const numberOfStacks = getNumberOfStacks(studyInstanceUid);
    if (!numberOfStacks || numberOfStacks === 1) {
      return;
    }

    const study = getStudyFromStudyInstanceUid(studyInstanceUid);

    const displaySetInstanceUids = study.series.map(series => {
      return series.displaySetInstanceUid;
    });

    const currentLoadedStackIndex = displaySetInstanceUids.indexOf(displaySetInstanceUid);

    const newStackIndex = indexCalculator(currentLoadedStackIndex, numberOfStacks);
    if (currentLoadedStackIndex === newStackIndex) {
      return;
    }

    const newDisplaySetInstanceUid = displaySetInstanceUids[newStackIndex];

    const data = {
      displaySetInstanceUid: newDisplaySetInstanceUid,
      viewportIndex,
      studyInstanceUid,
      seriesInstanceUid
    };

    OHIF.viewerbase.layoutManager.rerenderViewportWithNewDisplaySet(viewportIndex, data);
};

const loadPreviousSeries = () => {
    const indexCalculator = currentLoadedStackIndex => Math.max(currentLoadedStackIndex - 1, 0);
    
    loadSeries(indexCalculator);
};

const loadNextSeries = () => {
    const indexCalculator = (currentLoadedStackIndex, numberOfStacks) => Math.min(currentLoadedStackIndex + 1, numberOfStacks - 1);

    loadSeries(indexCalculator);
};

const seriesNavigation = {
    loadPreviousSeries,
    loadNextSeries
};

export { seriesNavigation };
