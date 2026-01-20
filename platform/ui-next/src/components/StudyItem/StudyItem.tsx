import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ThumbnailList } from '../ThumbnailList';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../Accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

const StudyItem = ({
  date,
  patientName,
  description,
  numInstances,
  modalities,
  isActive,
  onClick,
  isExpanded,
  displaySets,
  activeDisplaySetInstanceUIDs,
  onClickThumbnail,
  onDoubleClickThumbnail,
  onClickUntrack,
  onSegmentationClick,
  segmentationVisibility = new Map(),
  onRunSegmentation,
  onReportClick,
  onChatWithReportClick,
  onProcessClick,
  studiesWithReports = new Set(),
  viewPreset = 'thumbnails',
  ThumbnailMenuItems,
  StudyMenuItems,
  StudyInstanceUID,
  isProcessing = false,
  isUploadingDicom = false,
}: withAppTypes) => {
  const formatPatientName = (name: string) => {
    if (!name) return { firstName: '', lastName: '' };
    const parts = name.split('^');
    if (parts.length >= 2) {
      return { 
        firstName: parts[1]?.trim() || '', 
        lastName: parts[0]?.trim() || '' 
      };
    }
    return { firstName: name, lastName: '' };
  };

  const { firstName, lastName } = formatPatientName(patientName || '');
  return (
    <Accordion
      type="single"
      collapsible
      value={isExpanded ? 'study-item' : undefined}
      onValueChange={(value) => {
        // Call onClick whenever the accordion state changes
        // The parent's onClick handler will toggle the expanded state correctly
        onClick();
      }}
    >
      <AccordionItem value="study-item">
        <AccordionTrigger className={classnames('hover:bg-accent bg-popover group w-full rounded')}>
          <div className="flex h-[40px] w-full flex-row overflow-hidden">
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex min-w-0 flex-col items-start text-[13px]">
                <Tooltip>
                  <TooltipContent>{patientName || 'No patient name'}</TooltipContent>
                  <TooltipTrigger
                    className="w-full"
                    asChild
                  >
                    <div className="flex w-full max-w-[160px] flex-col text-left text-white">
                      <div className="h-[18px] w-full overflow-hidden truncate whitespace-nowrap">
                        {firstName || 'No name'}
                      </div>
                      {lastName && (
                        <div className="text-muted-foreground h-[18px] w-full overflow-hidden truncate whitespace-nowrap">
                          {lastName}
                        </div>
                      )}
                      {!lastName && description && (
                        <div className="text-muted-foreground h-[18px] w-full overflow-hidden truncate whitespace-nowrap">
                          {description}
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                </Tooltip>
              </div>
              <div className="text-muted-foreground flex flex-col items-end pl-[10px] text-[12px]">
                <div className="max-w-[150px] overflow-hidden text-ellipsis">{modalities}</div>
                <div>{numInstances}</div>
              </div>
              <div className="ml-2 flex items-center gap-2">
                {onProcessClick && !studiesWithReports.has(StudyInstanceUID) && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onProcessClick(StudyInstanceUID);
                    }}
                    disabled={isProcessing || isUploadingDicom}
                    className="bg-orange-500 hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Process
                  </button>
                )}
                {onProcessClick && studiesWithReports.has(StudyInstanceUID) && onReportClick && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onReportClick(StudyInstanceUID);
                    }}
                    disabled={isProcessing}
                    className="bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Report
                  </button>
                )}
                {onProcessClick && studiesWithReports.has(StudyInstanceUID) && onChatWithReportClick && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onChatWithReportClick(StudyInstanceUID);
                    }}
                    disabled={isProcessing}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Chat
                  </button>
                )}
                {!onProcessClick && onRunSegmentation && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRunSegmentation(StudyInstanceUID);
                    }}
                    disabled={isProcessing}
                    className="bg-primary hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Segment
                  </button>
                )}
                {!onProcessClick && onReportClick && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onReportClick(StudyInstanceUID);
                    }}
                    disabled={isProcessing}
                    className="bg-secondary hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Report
                  </button>
                )}
                {!onProcessClick && onChatWithReportClick && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onChatWithReportClick(StudyInstanceUID);
                    }}
                    disabled={isProcessing}
                    className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded px-2 py-0.5 text-[11px] font-semibold text-white"
                  >
                    Chat
                  </button>
                )}
                {StudyMenuItems && <StudyMenuItems StudyInstanceUID={StudyInstanceUID} />}
              </div>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent
          onClick={event => {
            event.stopPropagation();
          }}
        >
          {isExpanded && displaySets && (
            <ThumbnailList
              thumbnails={displaySets}
              activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
              onThumbnailClick={onClickThumbnail}
              onThumbnailDoubleClick={onDoubleClickThumbnail}
              onClickUntrack={onClickUntrack}
              onSegmentationClick={onSegmentationClick}
              segmentationVisibility={segmentationVisibility}
              viewPreset={viewPreset}
              ThumbnailMenuItems={ThumbnailMenuItems}
            />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

StudyItem.propTypes = {
  date: PropTypes.string,
  patientName: PropTypes.string,
  description: PropTypes.string,
  modalities: PropTypes.string.isRequired,
  numInstances: PropTypes.number.isRequired,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
  displaySets: PropTypes.array,
  activeDisplaySetInstanceUIDs: PropTypes.array,
  onClickThumbnail: PropTypes.func,
  onDoubleClickThumbnail: PropTypes.func,
  onClickUntrack: PropTypes.func,
  viewPreset: PropTypes.string,
  StudyMenuItems: PropTypes.func,
  StudyInstanceUID: PropTypes.string,
  isProcessing: PropTypes.bool,
  isUploadingDicom: PropTypes.bool,
};

export { StudyItem };
