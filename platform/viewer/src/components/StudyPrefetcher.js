import React, { useEffect } from 'react';
import { classes } from '@ohif/core';
import PropTypes from 'prop-types';
import cs from 'cornerstone-core';

import './StudyPrefetcher.css';

const StudyPrefetcher = ({ studies, viewportIndex, options }) => {
  const studyPrefetcher = classes.StudyPrefetcher.getInstance(studies, options);

  useEffect(() => {
    studyPrefetcher.setStudies(studies);

    const onImageRendered = ({ detail }) => {
      console.debug('Prefetching...');
      studyPrefetcher.prefetch(detail.element);
      detail.element.removeEventListener(
        cs.EVENTS.IMAGE_RENDERED,
        onImageRendered
      );
    };

    const activeEnabledElement = cs.getEnabledElements()[viewportIndex];
    if (activeEnabledElement && activeEnabledElement.image) {
      activeEnabledElement.element.addEventListener(
        cs.EVENTS.IMAGE_RENDERED,
        onImageRendered
      );
    }

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
  }, [studies, viewportIndex, studyPrefetcher]);

  return null;
};

StudyPrefetcher.propTypes = {
  studies: PropTypes.array.isRequired,
  viewportIndex: PropTypes.number.isRequired,
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
