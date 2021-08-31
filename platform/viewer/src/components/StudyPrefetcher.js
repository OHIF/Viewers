import React, { useEffect, useState } from 'react';
import { classes } from '@ohif/core';
import PropTypes from 'prop-types';
import cs from 'cornerstone-core';

import './StudyPrefetcher.css';

const StudyPrefetcher = ({
  autoPrefetch,
  displaySetInstanceUID,
  studies,
  options,
  viewportIndex,
}) => {
  const [activeDisplaySet, setActiveDisplaySet] = useState();

  useEffect(() => {
    if (
      activeDisplaySet !== null &&
      displaySetInstanceUID &&
      displaySetInstanceUID !== activeDisplaySet
    ) {
      setActiveDisplaySet(displaySetInstanceUID);
      const enabledElement = cs.getEnabledElements()[viewportIndex];
      if (enabledElement) {
        const studyPrefetcher = classes.StudyPrefetcher.getInstance(
          studies,
          options
        );
        studyPrefetcher.prefetch(enabledElement.element, displaySetInstanceUID);
      }
    }
  }, [
    activeDisplaySet,
    displaySetInstanceUID,
    options,
    studies,
    viewportIndex,
  ]);

  useEffect(() => {
    const AUTO_PREFETCH_ORDERS = ['topdown', 'all'];
    if (!AUTO_PREFETCH_ORDERS.includes(options.order)) {
      return;
    }

    const studyPrefetcher = classes.StudyPrefetcher.getInstance(
      studies,
      options
    );
    studyPrefetcher.setStudies(studies);

    const onImageRendered = ({ detail }) => {
      console.debug('Prefetching...');
      studyPrefetcher.prefetch(detail.element);
      detail.element.removeEventListener(
        cs.EVENTS.IMAGE_RENDERED,
        onImageRendered
      );
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
  }, [autoPrefetch, options, studies]);

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
