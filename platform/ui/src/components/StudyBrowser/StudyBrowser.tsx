import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ButtonGroup, Button, StudyItem, ThumbnailList } from '../';
import { StringNumber } from '../../types';

const getTrackedSeries = displaySets => {
  let trackedSeries = 0;
  displaySets.forEach(displaySet => {
    if (displaySet.isTracked) {
      trackedSeries++;
    }
  });

  return trackedSeries;
};

const StudyBrowser = ({
  tabs,
  activeTabName,
  expandedStudyInstanceUIDs,
  onClickTab,
  onClickStudy,
  onClickThumbnail,
  onDoubleClickThumbnail,
  onClickUntrack,
  activeDisplaySetInstanceUIDs,
  servicesManager,
}) => {
  const { t } = useTranslation('StudyBrowser');
  const { customizationService } = servicesManager?.services || {};

  const getTabContent = () => {
    const tabData = tabs.find(tab => tab.name === activeTabName);
    return tabData.studies.map(
      ({
        studyInstanceUid,
        date,
        description,
        numInstances,
        modalities,
        displaySets,
      }) => {
        const isExpanded = expandedStudyInstanceUIDs.includes(studyInstanceUid);
        return (
          <React.Fragment key={studyInstanceUid}>
            <StudyItem
              date={date}
              description={description}
              numInstances={numInstances}
              modalities={modalities}
              trackedSeries={getTrackedSeries(displaySets)}
              isActive={isExpanded}
              onClick={() => {
                onClickStudy(studyInstanceUid);
              }}
              data-cy="thumbnail-list"
            />
            {isExpanded && displaySets && (
              <ThumbnailList
                thumbnails={displaySets}
                activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
                onThumbnailClick={onClickThumbnail}
                onThumbnailDoubleClick={onDoubleClickThumbnail}
                onClickUntrack={onClickUntrack}
              />
            )}
          </React.Fragment>
        );
      }
    );
  };

  return (
    <React.Fragment>
      <div
        className="flex flex-row items-center justify-center h-16 p-4 border-b w-100 border-secondary-light bg-primary-dark"
        data-cy={'studyBrowser-panel'}
      >
        <ButtonGroup variant="outlined" color="secondary" splitBorder={false}>
          {tabs.map(tab => {
            const { name, label, studies } = tab;
            const isActive = activeTabName === name;
            const isDisabled = !studies.length;
            // Apply the contrasting color for brighter button color visibility
            const classStudyBrowser = customizationService?.getModeCustomization(
              'class:StudyBrowser'
            ) || {
              true: 'default',
              false: 'default',
            };
            const color = classStudyBrowser[`${isActive}`];
            return (
              <Button
                key={name}
                className={'text-white text-base p-2 min-w-18'}
                size="initial"
                color={color}
                bgColor={isActive ? 'bg-primary-main' : 'bg-black'}
                onClick={() => {
                  onClickTab(name);
                }}
                disabled={isDisabled}
              >
                {t(label)}
              </Button>
            );
          })}
        </ButtonGroup>
      </div>
      <div className="flex flex-col flex-1 overflow-auto">
        {getTabContent()}
      </div>
    </React.Fragment>
  );
};

StudyBrowser.propTypes = {
  onClickTab: PropTypes.func.isRequired,
  onClickStudy: PropTypes.func,
  onClickThumbnail: PropTypes.func,
  onDoubleClickThumbnail: PropTypes.func,
  onClickUntrack: PropTypes.func,
  activeTabName: PropTypes.string.isRequired,
  expandedStudyInstanceUIDs: PropTypes.arrayOf(PropTypes.string).isRequired,
  activeDisplaySetInstanceUIDs: PropTypes.arrayOf(PropTypes.string),
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      studies: PropTypes.arrayOf(
        PropTypes.shape({
          studyInstanceUid: PropTypes.string.isRequired,
          date: PropTypes.string,
          numInstances: PropTypes.number,
          modalities: PropTypes.string,
          description: PropTypes.string,
          displaySets: PropTypes.arrayOf(
            PropTypes.shape({
              displaySetInstanceUID: PropTypes.string.isRequired,
              imageSrc: PropTypes.string,
              imageAltText: PropTypes.string,
              seriesDate: PropTypes.string,
              seriesNumber: StringNumber,
              numInstances: PropTypes.number,
              description: PropTypes.string,
              componentType: PropTypes.oneOf([
                'thumbnail',
                'thumbnailTracked',
                'thumbnailNoImage',
              ]).isRequired,
              isTracked: PropTypes.bool,
              viewportIdentificator: PropTypes.arrayOf(PropTypes.string),
              /**
               * Data the thumbnail should expose to a receiving drop target. Use a matching
               * `dragData.type` to identify which targets can receive this draggable item.
               * If this is not set, drag-n-drop will be disabled for this thumbnail.
               *
               * Ref: https://react-dnd.github.io/react-dnd/docs/api/use-drag#specification-object-members
               */
              dragData: PropTypes.shape({
                /** Must match the "type" a dropTarget expects */
                type: PropTypes.string.isRequired,
              }),
            })
          ),
        })
      ).isRequired,
    })
  ),
};

const noop = () => {};

StudyBrowser.defaultProps = {
  onClickTab: noop,
  onClickStudy: noop,
  onClickThumbnail: noop,
  onDoubleClickThumbnail: noop,
  onClickUntrack: noop,
};

export default StudyBrowser;
