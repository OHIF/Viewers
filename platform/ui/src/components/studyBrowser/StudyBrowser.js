import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import PropTypes from 'prop-types';
import { Thumbnail } from './Thumbnail.js';
import cornerstone from 'cornerstone-core';
import './StudyBrowser.styl';
import { getItem, setItem } from '@ohif/viewer/src/lib/localStorageUtils.js';
import eventBus from '@ohif/viewer/src/lib/eventBus.js';

let hasRestoredState = false;

function StudyBrowser(props) {
  const {
    studies,
    onThumbnailClick,
    onThumbnailDoubleClick,
    supportsDrag,
  } = props;
  const location = useLocation();

  const [hideThumbnails, setHideThumbnails] = useState(true);
  const [useEffectCalled, setUseEffectCalled] = useState(false);

  function handleThumbnailClick(displaySetInstanceUID, imageId) {
    const instance_uid = imageId.split('/')[14];
    setItem('restoreToolStateRan', false); // 1 means true
    setItem(`active_thumbnail::${instance_uid}`, {
      displaySetInstanceUID,
      imageId,
    });

    onThumbnailClick(displaySetInstanceUID, imageId);
    eventBus.dispatch('handleThumbnailClick', {
      instance_uid,
    });
  }

  useEffect(() => {
    if (
      location.pathname.includes('/view') ||
      location.pathname.includes('/edit')
    ) {
      setHideThumbnails(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    cornerstone.events.addEventListener(
      cornerstone.EVENTS.ELEMENT_ENABLED,
      onCornerstoneLoaded
    );
    return () =>
      cornerstone.events.removeEventListener(
        cornerstone.EVENTS.ELEMENT_ENABLED,
        onCornerstoneLoaded
      );
  }, [studies]);

  const onImageRendered = event => {
    if (!hasRestoredState) {
      if (studies.length > 0 && useEffectCalled === false) {
        setUseEffectCalled(true);
        try {
          const activeStudy = getItem('selectedStudy');
          const activeThumbnail = getItem(
            `active_thumbnail::${activeStudy.StudyInstanceUID}`
          );
          if (activeThumbnail) {
            const { imageId } = activeThumbnail;
            const study = studies[0];
            const thumbnails = study.thumbnails;
            const thumbnailData = thumbnails.find(t => t.imageId === imageId);
            const displaySetInstanceUID = thumbnailData.displaySetInstanceUID;
            handleThumbnailClick(displaySetInstanceUID, imageId);
          } else {
            if (studies[0]) {
              const thumbnails = studies[0].thumbnails;
              const thumbnailData = thumbnails[0];
              if (thumbnailData) {
                const displaySetInstanceUID =
                  thumbnailData.displaySetInstanceUID;
                const imageId = thumbnailData.imageId;
                handleThumbnailClick(displaySetInstanceUID, imageId);
              }
            }
          }
        } catch (error) {
          console.log(error);
        }
      }

      hasRestoredState = true;
    }
  };

  const onCornerstoneLoaded = enabledEvt => {
    const element = enabledEvt.detail.element;
    element.addEventListener(
      cornerstone.EVENTS.IMAGE_RENDERED,
      onImageRendered
    );
  };

  return (
    <div className="study-browser">
      {hideThumbnails ? null : (
        <div className="scrollable-study-thumbnails">
          {studies
            .map((study, studyIndex) => {
              const { StudyInstanceUID } = study;

              return study.thumbnails.map((thumb, thumbIndex) => {
                // console.log({ thumb });
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
                    <Thumbnail
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
                      onClick={handleThumbnailClick.bind(
                        undefined,
                        displaySetInstanceUID,
                        imageId
                      )}
                      onDoubleClick={onThumbnailDoubleClick}
                    />
                  </div>
                );
              });
            })
            .flat()}
        </div>
      )}
    </div>
  );
}

const noop = () => {};

StudyBrowser.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      StudyInstanceUID: PropTypes.string.isRequired,
      thumbnails: PropTypes.arrayOf(
        PropTypes.shape({
          altImageText: PropTypes.string,
          displaySetInstanceUID: PropTypes.string.isRequired,
          imageId: PropTypes.string,
          InstanceNumber: PropTypes.number,
          numImageFrames: PropTypes.number,
          SeriesDescription: PropTypes.string,
          SeriesNumber: PropTypes.number,
          stackPercentComplete: PropTypes.number,
        })
      ),
    })
  ).isRequired,
  supportsDrag: PropTypes.bool,
  onThumbnailClick: PropTypes.func,
  onThumbnailDoubleClick: PropTypes.func,
};

StudyBrowser.defaultProps = {
  studies: [],
  supportsDrag: true,
  onThumbnailClick: noop,
  onThumbnailDoubleClick: noop,
};

export { StudyBrowser };
