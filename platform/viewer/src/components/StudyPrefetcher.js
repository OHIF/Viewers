import React, { useEffect } from 'react';
import { classes, utils } from '@ohif/core';
import PropTypes from 'prop-types';
// import cs from 'cornerstone-core';

import './StudyPrefetcher.css';

const StudyPrefetcher = ({ studies, options, activeViewportData }) => {
  useEffect(() => {
    const studyPrefetcher = classes.StudyPrefetcher.getInstance(
      studies,
      options
    );
    const studiesMetadata = studies.map(s =>
      utils.studyMetadataManager.get(s.StudyInstanceUID)
    );
    studyPrefetcher.setStudies(studiesMetadata);

    return () => {
      studyPrefetcher.destroy();
    };
  }, [options, studies]);

  useEffect(() => {
    if (!activeViewportData || !activeViewportData.plugin === 'cornerstone') {
      return;
    }

    const studyPrefetcher = classes.StudyPrefetcher.getInstance();

    const { displaySetInstanceUID } = activeViewportData;
    if (!displaySetInstanceUID) {
      return;
    }

    studyPrefetcher.prefetch(displaySetInstanceUID);
  }, [activeViewportData]);

  return null;
};

StudyPrefetcher.propTypes = {
  studies: PropTypes.array.isRequired,
  options: PropTypes.shape({
    enabled: PropTypes.bool,
    order: PropTypes.string,
    displaySetCount: PropTypes.number,
    preventCache: PropTypes.bool,
    prefetchDisplaySetsTimeout: PropTypes.number,
    includeActiveDisplaySet: PropTypes.bool,
  }),
};

StudyPrefetcher.defaultProps = {
  options: {
    order: 'closest',
    displaySetCount: 1,
    preventCache: false,
    prefetchDisplaySetsTimeout: 300,
    includeActiveDisplaySet: false,
  },
};

export default StudyPrefetcher;
