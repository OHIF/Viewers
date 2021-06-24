import React, { useEffect, useState } from 'react';
import { classes } from '@ohif/core';
import PropTypes from 'prop-types';
import cs from 'cornerstone-core';
import { useSelector } from 'react-redux';

import './StudyPrefetcher.css';
import studyMetadataManager from '../../../core/src/utils/studyMetadataManager';

const StudyPrefetcher = ({ studies, viewportIndex, options }) => {
  const [cacheMap, setCacheMap] = useState(new Map());

  const displaySetInstanceUID = useSelector(state => {
    const { viewports = {} } = state;
    const { activeViewportIndex, viewportSpecificData = {} } = viewports;
    const viewportData = viewportSpecificData[activeViewportIndex] || {};
    return viewportData.displaySetInstanceUID;
  });

  const onImageCached = imageId => {
    setCacheMap(map => {
      map.set(imageId, true);
      return new Map(map);
    });
  };

  const onImagesBeingCached = imageIds => {
    const map = new Map();
    imageIds.forEach(imageId => map.set(imageId, false));
    setCacheMap(map);
  };

  const studyPrefetcher = classes.StudyPrefetcher.getInstance(studies, {
    ...options,
    onImageCached,
    onImagesBeingCached,
  });

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
  }, [studies, viewportIndex, studyPrefetcher, displaySetInstanceUID]);

  const items = Array.from(cacheMap.values());
  const progress = items.map((isImageCached, index) => {
    const barWidth = document.querySelector('.StudyPrefetcher').offsetWidth;
    const width = index * (barWidth / items.length);
    return (
      <div
        key={`progress-item-${index}`}
        className={isImageCached ? 'item cached' : 'item'}
        style={{ width: `${width}px` }}
      ></div>
    );
  });

  return (
    options.displayProgress && <div className="StudyPrefetcher">{progress}</div>
  );
};

StudyPrefetcher.propTypes = {
  studies: PropTypes.array.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  options: PropTypes.shape({
    order: PropTypes.string,
    displaySetCount: PropTypes.number,
  }),
};

StudyPrefetcher.defaultProps = {
  options: {
    order: 'closest',
    displaySetCount: 1,
    requestType: 'prefetch',
    preventCache: false,
    prefetchDisplaySetsTimeout: 300,
    displayProgress: false,
    includeActiveDisplaySet: false,
  },
};

export default StudyPrefetcher;
