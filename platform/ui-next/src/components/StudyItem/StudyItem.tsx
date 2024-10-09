import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ThumbnailList } from '../ThumbnailList';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../Accordion';

const StudyItem = ({
  date,
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
  viewPreset = 'thumbnails',
}) => {
  return (
    <Accordion
      type="single"
      collapsible
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex={0}
      defaultValue={isActive ? 'study-item' : undefined}
    >
      <AccordionItem value="study-item">
        <AccordionTrigger className={classnames('hover:bg-accent bg-popover rounded')}>
          <div className="flex h-[40px] flex-1 flex-row">
            <div className="flex w-full flex-row items-center justify-between">
              <div className="flex flex-col items-start text-[13px]">
                <div className="text-white">{date}</div>
                <div className="text-muted-foreground max-w-[160px] overflow-hidden truncate whitespace-nowrap">
                  {description}
                </div>
              </div>
              <div className="text-muted-foreground mr-2 flex flex-col items-end text-[12px]">
                <div>{modalities}</div>
                <div>{numInstances}</div>
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
              viewPreset={viewPreset}
            />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

StudyItem.propTypes = {
  date: PropTypes.string.isRequired,
  description: PropTypes.string,
  modalities: PropTypes.string.isRequired,
  numInstances: PropTypes.number.isRequired,
  trackedSeries: PropTypes.number,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool,
  displaySets: PropTypes.array,
  activeDisplaySetInstanceUIDs: PropTypes.array,
  onClickThumbnail: PropTypes.func,
  onDoubleClickThumbnail: PropTypes.func,
  onClickUntrack: PropTypes.func,
  viewPreset: PropTypes.string,
};

export { StudyItem };
