import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { ButtonGroup, Button, StudyItem, ThumbnailList } from '@ohif/ui';

const buttonClasses = 'text-white text-base border-none bg-black p-2 min-w-18';
const activeButtonClasses = 'bg-primary-main';

const getInitialActiveTab = (tabs) => {
  return tabs && tabs[0] && tabs[0].name;
};

const getTrackedSeries = (displaySets) => {
  let trackedSeries = 0;
  displaySets.forEach((displaySet) => {
    if (displaySet.isTracked) {
      trackedSeries++;
    }
  });

  return trackedSeries;
};

const StudyBrowser = ({ tabs }) => {
  const [tabActive, setTabActive] = useState(getInitialActiveTab(tabs));
  const [studyActive, setStudyActive] = useState(null);
  const [thumbnailActive, setThumbnailActive] = useState(null);

  const getTabContent = () => {
    const tabData = tabs.find((tab) => tab.name === tabActive);

    if (!tabData || !tabData.studies || !Array.isArray(tabData.studies)) {
      return;
    }

    return tabData.studies.map(
      ({
        studyInstanceUid,
        date,
        description,
        numInstances,
        modalities,
        displaySets,
      }) => {
        const isActive = studyActive === studyInstanceUid;
        return (
          <React.Fragment key={studyInstanceUid}>
            <StudyItem
              date={date}
              description={description}
              numInstances={numInstances}
              modalities={modalities}
              trackedSeries={getTrackedSeries(displaySets)}
              isActive={isActive}
              onClick={() => {
                setStudyActive(isActive ? null : studyInstanceUid);
              }}
            />
            {isActive && displaySets && (
              <ThumbnailList
                thumbnails={displaySets}
                thumbnailActive={thumbnailActive}
                onThumbnailClick={(thumbnailId) =>
                  setThumbnailActive(
                    thumbnailId === thumbnailActive ? null : thumbnailId
                  )
                }
              />
            )}
          </React.Fragment>
        );
      }
    );
  };

  return (
    <React.Fragment>
      <div className="flex flex-row items-center justify-center border-b w-100 h-16 border-secondary-light p-4 bg-primary-dark">
        <ButtonGroup
          variant="outlined"
          color="inherit"
          className="border border-secondary-light rounded-md"
        >
          {tabs.map((tab) => {
            const { name, label } = tab;
            const isActive = tabActive === name;
            return (
              <Button
                key={name}
                className={classnames(
                  buttonClasses,
                  isActive && activeButtonClasses
                )}
                size="initial"
                onClick={() => {
                  setTabActive(name);
                  setStudyActive(null);
                }}
              >
                {label}
              </Button>
            );
          })}
        </ButtonGroup>
      </div>
      <div className="flex flex-col flex-1 overflow-auto invisible-scrollbar">
        {getTabContent()}
      </div>
    </React.Fragment>
  );
};

StudyBrowser.propTypes = {
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
              displaySetInstanceUid: PropTypes.string.isRequired,
              imageSrc: PropTypes.string,
              imageAltText: PropTypes.string,
              seriesDate: PropTypes.string,
              seriesNumber: PropTypes.number,
              numInstances: PropTypes.number,
              description: PropTypes.string,
              componentType: PropTypes.oneOf([
                'thumbnail',
                'thumbnailTracked',
                'thumbnailNoImage',
              ]).isRequired,
              isTracked: PropTypes.bool,
              viewportIdentificator: PropTypes.string,
            })
          ),
        })
      ).isRequired,
    })
  ),
};

export default StudyBrowser;
