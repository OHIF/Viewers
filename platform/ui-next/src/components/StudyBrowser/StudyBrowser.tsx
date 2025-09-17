import React from 'react';
import PropTypes from 'prop-types';

import { StudyItem } from '../StudyItem';
import { StudyBrowserSort } from '../StudyBrowserSort';
import { StudyBrowserViewOptions } from '../StudyBrowserViewOptions';
import { ScrollArea } from '../ScrollArea';
import { StudyBrowserSkeleton } from '@xylexa/xylexa-app';

const noop = () => {};

const StudyBrowser = ({
  tabs,
  activeTabName,
  onClickTab = noop,
  onClickStudy = noop,
  onClickThumbnail = noop,
  onDoubleClickThumbnail = noop,
  onClickUntrack = noop,
  activeDisplaySetInstanceUIDs,
  servicesManager,
  showSettings,
  viewPresets,
  ThumbnailMenuItems,
  StudyMenuItems,
}: withAppTypes) => {
  const getTabContent = () => {
    const tabData = tabs.find(tab => tab.name === activeTabName);
    const viewPreset = viewPresets
      ? viewPresets.filter(preset => preset.selected)[0]?.id
      : 'thumbnails';
    return tabData?.studies?.map(
      ({ studyInstanceUid, date, description, numInstances, modalities, displaySets }) => {
        const isExpanded = true; //default behaviour
        const displaySetsPerSeries = groupDisplaySetsPerSeries(displaySets);
        return (
          <React.Fragment key={studyInstanceUid}>
            {displaySetsPerSeries.map(displaySetPerSeries => {
              const respectiveSeriesInstanceUID = displaySetPerSeries[0].parentSeriesInstanceUID;
              return (
                <StudyItem
                  key={respectiveSeriesInstanceUID}
                  date={date}
                  description={description}
                  numInstances={numInstances}
                  isExpanded={isExpanded}
                  displaySets={displaySetPerSeries}
                  modalities={modalities}
                  trackedSeries={getTrackedSeries(displaySets)}
                  isActive={isExpanded}
                  onClick={() => onClickStudy(respectiveSeriesInstanceUID)}
                  onClickThumbnail={onClickThumbnail}
                  onDoubleClickThumbnail={onDoubleClickThumbnail}
                  onClickUntrack={onClickUntrack}
                  activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
                  data-cy="thumbnail-list"
                  viewPreset={viewPreset}
                  ThumbnailMenuItems={ThumbnailMenuItems}
                  StudyMenuItems={StudyMenuItems}
                  StudyInstanceUID={studyInstanceUid}
                />
              );
            })}
          </React.Fragment>
        );
      }
    );
  };

  const isLoading = getTabContent().length === 0;

  return (
    <ScrollArea>
      <div
        className="bg-bkg-low flex flex-1 flex-col gap-[4px]"
        data-cy={'studyBrowser-panel'}
      >
        <div className="flex flex-col gap-[4px]">
          {showSettings && (
            <div className="w-100 bg-bkg-low flex h-[48px] items-center justify-center gap-[10px] px-[8px] py-[10px]">
              <>
                <StudyBrowserViewOptions
                  tabs={tabs}
                  onSelectTab={onClickTab}
                  activeTabName={activeTabName}
                />
                <StudyBrowserSort servicesManager={servicesManager} />
              </>
            </div>
          )}
          <div className="ohif-scrollbar invisible-scrollbar bg-bkg-low flex flex-1 flex-col gap-[4px] overflow-auto">
            {isLoading ? <StudyBrowserSkeleton /> : getTabContent()}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

const getTrackedSeries = displaySets => {
  let trackedSeries = 0;
  displaySets.forEach(displaySet => {
    if (displaySet.isTracked) {
      trackedSeries++;
    }
  });

  return trackedSeries;
};

function groupDisplaySetsPerSeries(allInstancesDisplaySets: DisplaySet[]): DisplaySet[][] {
  return Object.values(
    allInstancesDisplaySets.reduce((accumulator, obj) => {
      return groupDisplaySetsHavingCommonSeries(accumulator, obj);
    }, {})
  );
}

function groupDisplaySetsHavingCommonSeries(accumulator, obj) {
  accumulator[obj.parentSeriesInstanceUID] = accumulator[obj.parentSeriesInstanceUID] || [];
  accumulator[obj.parentSeriesInstanceUID].push(obj);
  return accumulator;
}

export type DragData = {
  type: string;
  displaySetInstanceUID: string;
};

export type DisplaySet = {
  displaySetInstanceUID: string;
  description: string;
  seriesNumber: 11;
  modality: string;
  seriesDate: string;
  numInstances: number;
  messages: {
    messages: [];
  };
  StudyInstanceUID: string;
  componentType: string;
  dragData: DragData;
  isTracked: boolean;
  parentSeriesInstanceUID: string;
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
              seriesNumber: PropTypes.any,
              numInstances: PropTypes.number,
              description: PropTypes.string,
              componentType: PropTypes.oneOf(['thumbnail', 'thumbnailTracked', 'thumbnailNoImage'])
                .isRequired,
              isTracked: PropTypes.bool,
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
  StudyMenuItems: PropTypes.func,
};

export { StudyBrowser };
