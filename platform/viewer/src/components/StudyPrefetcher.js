import React, { useEffect } from 'react';
import { classes, utils } from '@ohif/core';
import PropTypes from 'prop-types';
import cs from 'cornerstone-core';

import './StudyPrefetcher.css';

const StudyPrefetcher = ({ studies, options }) => {
  useEffect(() => {
    const studyPrefetcher = classes.StudyPrefetcher.getInstance(
      studies,
      options
    );
    const studiesMetadata = studies.map(s =>
      utils.studyMetadataManager.get(s.StudyInstanceUID)
    );
    studyPrefetcher.setStudies(studiesMetadata);

    const onNewImage = ({ detail }) => {
      /**
       * When images are cached the viewport will load instantly and
       * the display sets will not be available at this point in time.
       *
       * This code add display sets and updates the study prefetcher metadata.
       */
      const studiesMetadata = studies.map(s => {
        const studyMetadata = utils.studyMetadataManager.get(
          s.StudyInstanceUID
        );
        const displaySets = studyMetadata.getDisplaySets();
        if (!displaySets || displaySets.length < 1) {
          s.displaySets.forEach(ds => studyMetadata.addDisplaySet(ds));
        }
        return studyMetadata;
      });
      studyPrefetcher.setStudies(studiesMetadata);

      const study = studyPrefetcher.getStudy(detail.image);
      const series = studyPrefetcher.getSeries(study, detail.image);
      const instance = studyPrefetcher.getInstance(series, detail.image);

      if (study.displaySets && study.displaySets.length > 0) {
        const {
          displaySetInstanceUID,
        } = studyPrefetcher.getDisplaySetBySOPInstanceUID(
          study.displaySets,
          instance
        );
        studyPrefetcher.prefetch(detail.element, displaySetInstanceUID);
      }
    };

    const onElementEnabled = ({ detail }) => {
      detail.element.addEventListener(cs.EVENTS.NEW_IMAGE, onNewImage);
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
