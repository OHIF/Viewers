import React, { useEffect, useState } from 'react';
import { XNATThumbnail } from './XNATThumbnail';
import XnatSessionRoiCollections from '../../utils/IO/queryXnatRois';
import sessionMap from '../../utils/sessionMap';

import './XNATStudyBrowser.styl';

const XNATSeriesThumbnails = props => {
  const {
    study,
    supportsDrag,
    studyIndex,
    onThumbnailClick,
    onThumbnailDoubleClick,
  } = props;

  const [hasRois, setHasRois] = useState(undefined);

  useEffect(() => {
    const queryObject = new XnatSessionRoiCollections();
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.APP_CONFIG === 'config/xnat-dev.js'
    ) {
      const session = sessionMap.getSession()[studyIndex];
      setHasRois(queryObject.queryAll(session));
    }
    return () => {
      queryObject.cancel();
    };
  }, []);

  const { StudyInstanceUID } = study;
  return study.thumbnails
    .filter(thumb => {
      // Exclude non-displayable series
      return thumb.imageId !== undefined;
    })
    .map((thumb, thumbIndex) => {
      // TODO: Thumb has more props than we care about?
      const {
        active,
        altImageText,
        displaySetInstanceUID,
        imageId,
        InstanceNumber,
        numImageFrames,
        SeriesDescription,
        SeriesNumber,
        stackPercentComplete,
        hasWarnings,
      } = thumb;

      return (
        <div
          key={thumb.displaySetInstanceUID}
          className="thumbnail-container"
          data-cy="thumbnail-list"
        >
          <XNATThumbnail
            active={active}
            supportsDrag={supportsDrag}
            key={`${studyIndex}_${thumbIndex}`}
            id={`${studyIndex}_${thumbIndex}`} // Unused?
            // Study
            StudyInstanceUID={StudyInstanceUID} // used by drop
            // Thumb
            altImageText={altImageText}
            imageId={imageId}
            InstanceNumber={InstanceNumber}
            displaySetInstanceUID={displaySetInstanceUID} // used by drop
            numImageFrames={numImageFrames}
            SeriesDescription={SeriesDescription}
            SeriesNumber={SeriesNumber}
            hasWarnings={hasWarnings}
            stackPercentComplete={stackPercentComplete}
            // Events
            onClick={onThumbnailClick.bind(undefined, displaySetInstanceUID)}
            onDoubleClick={onThumbnailDoubleClick}
            // XNAT ROIS
            hasRois={hasRois}
          />
        </div>
      );
    });
};

export default XNATSeriesThumbnails;
