import React, { useEffect } from 'react';
import { classes } from '@ohif/core';
import PropTypes from 'prop-types';
import cs from 'cornerstone-core';

import './StudyPrefetcher.css';

const StudyPrefetcher = ({ studies, options }) => {
  useEffect(() => {
    let prefetching = {};

    const studyPrefetcher = classes.StudyPrefetcher.getInstance(
      studies,
      options
    );
    studyPrefetcher.setStudies(studies);

    const onImageRendered = ({ detail }) => {
      const study = studyPrefetcher.getStudy(detail.image);
      const series = studyPrefetcher.getSeries(study, detail.image);
      const instance = studyPrefetcher.getInstance(series, detail.image);
      const {
        displaySetInstanceUID,
      } = studyPrefetcher.getDisplaySetBySOPInstanceUID(
        study.displaySets,
        instance
      );
      if (prefetching[displaySetInstanceUID] !== true) {
        console.debug('Prefetching...');
        studyPrefetcher.prefetch(detail.element, displaySetInstanceUID);
        prefetching[displaySetInstanceUID] = true;
      }
    };

    const onElementEnabled = ({ detail }) => {
      detail.element.addEventListener(
        cs.EVENTS.IMAGE_RENDERED,
        onImageRendered
      );
    };

    cs.events.addEventListener(cs.EVENTS.ELEMENT_ENABLED, onElementEnabled);

    return () => {
      cs.events.removeEventListener(
        cs.EVENTS.ELEMENT_ENABLED,
        onElementEnabled
      );
      studyPrefetcher.destroy();
    };
  }, [options, studies]);

  return null;
};

StudyPrefetcher.propTypes = {
  autoPrefetch: PropTypes.bool,
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
    autoPrefetch: true,
    order: 'closest',
    displaySetCount: 1,
    preventCache: false,
    prefetchDisplaySetsTimeout: 300,
    includeActiveDisplaySet: false,
  },
};

export default StudyPrefetcher;
