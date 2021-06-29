import React, { useEffect, useState } from 'react';
import { classes } from '@ohif/core';
import PropTypes from 'prop-types';
import cs from 'cornerstone-core';
import { useSelector } from 'react-redux';

import './StudyPrefetcher.css';
import studyMetadataManager from '../../../core/src/utils/studyMetadataManager';

let cachedMap = new Map();

const StudyPrefetcher = ({ studies, viewportIndex, options }) => {
  const [cacheMap, setCacheMap] = useState(cachedMap);

  const viewportData = useSelector(state => {
    const { viewports = {} } = state;
    const { activeViewportIndex, viewportSpecificData = {} } = viewports;
    const viewportData = viewportSpecificData[activeViewportIndex] || {};
    return viewportData;
  });

  const onImageCached = imageId => {
    setCacheMap(map => {
      const newMap = new Map(map);
      newMap.set(imageId, true);
      cachedMap = newMap;
      return newMap;
    });
  };

  const studyPrefetcher = classes.StudyPrefetcher.getInstance(studies, {
    ...options,
    onImageCached,
  });

  useEffect(() => {
    studyPrefetcher.setStudies(studies);

    const { StudyInstanceUID } = viewportData;
    const studyMetadata = studyMetadataManager.get(StudyInstanceUID);
    if (studyMetadata && studyMetadata.displaySets.length > 0) {
      const imageIds = studyMetadata.displaySets.reduce(
        (ids, ds) => ids.concat(ds.images.map(i => i.getImageId())),
        []
      );
      const cachedImages = cs.imageCache.cachedImages.map(i => i.imageId);
      const newMap = new Map(cachedMap);
      imageIds.forEach(imageId => {
        if (newMap.get(imageId) !== true) {
          newMap.set(imageId, false);
        }
      });
      cachedImages.forEach(imageId => newMap.set(imageId, true));
      setCacheMap(newMap);
      cachedMap = newMap;
    }

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
  }, [studies, viewportIndex, studyPrefetcher, viewportData]);

  if (options.displayProgress) {
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

    return <div className="StudyPrefetcher">{progress}</div>;
  }

  return null;
};

StudyPrefetcher.propTypes = {
  studies: PropTypes.array.isRequired,
  viewportIndex: PropTypes.number.isRequired,
  options: PropTypes.shape({
    enabled: PropTypes.bool,
    order: PropTypes.string,
    displaySetCount: PropTypes.number,
    requestType: PropTypes.string,
    preventCache: PropTypes.bool,
    prefetchDisplaySetsTimeout: PropTypes.number,
    displayProgress: PropTypes.bool,
    includeActiveDisplaySet: PropTypes.bool,
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
