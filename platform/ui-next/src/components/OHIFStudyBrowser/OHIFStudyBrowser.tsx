import React from 'react';
import PropTypes from 'prop-types';

import { OHIFStudyItem } from './OHIFStudyItem';
import { OHIFStudyBrowserSort } from './OHIFStudyBrowserSort';
import { OHIFStudyBrowserViewOptions } from './OHIFStudyBrowserViewOptions';

const getTrackedSeries = displaySets => {
  let trackedSeries = 0;
  displaySets.forEach(displaySet => {
    if (displaySet.isTracked) {
      trackedSeries++;
    }
  });

  return trackedSeries;
};

const noop = () => {};

export function OHIFStudyBrowser({
  tabs,
  activeTabName,
  expandedStudyInstanceUIDs,
  onClickTab = noop,
  onClickStudy = noop,
  onClickThumbnail = noop,
  onDoubleClickThumbnail = noop,
  onClickUntrack = noop,
  activeDisplaySetInstanceUIDs,
  servicesManager,
  showSettings,
  viewPresets,
  onThumbnailContextMenu,
}: withAppTypes) {
  const getTabContent = () => {
    const tabData = tabs.find(tab => tab.name === activeTabName);
    const viewPreset = viewPresets
      ? viewPresets.filter(preset => preset.selected)[0]?.id
      : 'thumbnails';
    return tabData.studies.map(
      ({ studyInstanceUid, date, description, numInstances, modalities, displaySets }) => {
        const isExpanded = expandedStudyInstanceUIDs.includes(studyInstanceUid);
        return (
          <React.Fragment key={studyInstanceUid}>
            <OHIFStudyItem
              date={date}
              description={description}
              numInstances={numInstances}
              isExpanded={isExpanded}
              displaySets={displaySets}
              modalities={modalities}
              trackedSeries={getTrackedSeries(displaySets)}
              isActive={isExpanded}
              onClick={() => {
                onClickStudy(studyInstanceUid);
              }}
              onClickThumbnail={onClickThumbnail}
              onDoubleClickThumbnail={onDoubleClickThumbnail}
              onClickUntrack={onClickUntrack}
              activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
              data-cy="thumbnail-list"
              viewPreset={viewPreset}
              onThumbnailContextMenu={onThumbnailContextMenu}
            />
          </React.Fragment>
        );
      }
    );
  };

  return (
    <div
      className="ohif-scrollbar invisible-scrollbar bg-bkg-low flex flex-1 flex-col gap-[4px] overflow-auto"
      data-cy={'studyBrowser-panel'}
    >
      <div>
        {showSettings && (
          <div className="w-100 bg-bkg-low flex h-[48px] items-center justify-center gap-[10px] px-[8px] py-[10px]">
            <>
              <OHIFStudyBrowserViewOptions
                tabs={tabs}
                onSelectTab={onClickTab}
                activeTabName={activeTabName}
              />
              <OHIFStudyBrowserSort servicesManager={servicesManager} />
            </>
          </div>
        )}
        {getTabContent()}
      </div>
    </div>
  );
}

OHIFStudyBrowser.propTypes = {
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
              seriesNumber: PropTypes.any,
              numInstances: PropTypes.number,
              description: PropTypes.string,
              componentType: PropTypes.oneOf([
                'thumbnail',
                'thumbnailTracked',
                'thumbnailNoImage',
              ]).isRequired,
              isTracked: PropTypes.bool,
              dragData: PropTypes.shape({
                type: PropTypes.string.isRequired,
              }),
            })
          ),
        })
      ).isRequired,
    })
  ),
};