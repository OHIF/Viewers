import React from 'react';

import { StudyItem } from '../StudyItem';
import { StudyBrowserSort } from '../StudyBrowserSort';
import { StudyBrowserViewOptions } from '../StudyBrowserViewOptions';
import { ScrollArea } from '../ScrollArea';

const noop = () => {};

interface StudyBrowserProps {
  onClickTab(...args: unknown[]): unknown;
  onClickStudy?(...args: unknown[]): unknown;
  onClickThumbnail?(...args: unknown[]): unknown;
  onDoubleClickThumbnail?(...args: unknown[]): unknown;
  onClickUntrack?(...args: unknown[]): unknown;
  activeTabName: string;
  expandedStudyInstanceUIDs: string[];
  activeDisplaySetInstanceUIDs?: string[];
  tabs?: {
    name: string;
    label: string;
    studies: {
      studyInstanceUid: string;
      date?: string;
      numInstances?: number;
      modalities?: string;
      description?: string;
      displaySets?: {
        displaySetInstanceUID: string;
        imageSrc?: string;
        imageAltText?: string;
        seriesDate?: string;
        seriesNumber?: any;
        numInstances?: number;
        description?: string;
        componentType: "thumbnail" | "thumbnailTracked" | "thumbnailNoImage";
        isTracked?: boolean;
        /**
         * Data the thumbnail should expose to a receiving drop target. Use a matching
         * `dragData.type` to identify which targets can receive this draggable item.
         * If this is not set, drag-n-drop will be disabled for this thumbnail.
         *
         * Ref: https://react-dnd.github.io/react-dnd/docs/api/use-drag#specification-object-members
         */
        dragData?: {
          /** Must match the "type" a dropTarget expects */
          type: string;
        };
      }[];
    }[];
  }[];
  StudyMenuItems?(...args: unknown[]): unknown;
}

const StudyBrowser = ({
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
  ThumbnailMenuItems,
  StudyMenuItems
}: StudyBrowserProps) => {
  const getTabContent = () => {
    const tabData = tabs.find(tab => tab.name === activeTabName);
    const viewPreset = viewPresets
      ? viewPresets.filter(preset => preset.selected)[0]?.id
      : 'thumbnails';
    return tabData?.studies?.map(
      ({ studyInstanceUid, date, description, numInstances, modalities, displaySets }) => {
        const isExpanded = expandedStudyInstanceUIDs.includes(studyInstanceUid);
        return (
          <React.Fragment key={studyInstanceUid}>
            <StudyItem
              date={date}
              description={description}
              numInstances={numInstances}
              isExpanded={isExpanded}
              displaySets={displaySets}
              modalities={modalities}
              isActive={isExpanded}
              onClick={() => onClickStudy(studyInstanceUid)}
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
          </React.Fragment>
        );
      }
    );
  };

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
          {getTabContent()}
        </div>
      </div>
    </ScrollArea>
  );
};

export { StudyBrowser };
