import React, { useState } from 'react';
import { utils } from '@ohif/core';
import { DISPLAY_SET_LOADING_STATUS } from '../../utils/StudyLoadingListener/XNATStudyLoadingListener';
import ColoredCircle from '../common/ColoredCircle';
import ScanLoadingProgress from '../common/ScanLoadingProgress';

const { studyMetadataManager } = utils;

const getDisplaySet = displaySetInstanceUID => {
  const studies = studyMetadataManager.all();
  const studyMetadata = studies.find(study =>
    study.displaySets.some(
      ds => ds.displaySetInstanceUID === displaySetInstanceUID
    )
  );
  const displaySet = studyMetadata.findDisplaySet(
    displaySet => displaySet.displaySetInstanceUID === displaySetInstanceUID
  );

  return displaySet;
};

const DisplaySetLoadingIndicator = props => {
  const { displaySetInstanceUID } = props;
  const displaySet = getDisplaySet(displaySetInstanceUID);
  const dataLoadingProgress = displaySet.dataLoadingProgress || {};

  const [loadingStatus, setLoadingStatus] = useState(
    dataLoadingProgress.loadingStatus
  );

  if (!dataLoadingProgress.hasOwnProperty('loadingStatus')) {
    return <div />;
  }

  let content = null;
  if (loadingStatus === DISPLAY_SET_LOADING_STATUS.LOADED) {
    content = <ColoredCircle color="var(--active-color)" />;
  } else {
    content = (
      <ScanLoadingProgress
        displaySetInstanceUID={displaySetInstanceUID}
        percentComplete={dataLoadingProgress.percentComplete}
        loadingStatus={loadingStatus}
        setLoadingStatus={status => setLoadingStatus(status)}
      />
    );
  }

  return (
    <div className="loading-progress">
      {content}
    </div>
  );
};

export default DisplaySetLoadingIndicator;
