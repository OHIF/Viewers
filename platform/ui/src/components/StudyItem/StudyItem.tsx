import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useTranslation } from 'react-i18next';
import ThumbnailList from '../ThumbnailList';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ohif/ui-next';

import Icon from '../Icon';

const StudyItem = ({
  date,
  description,
  numInstances,
  modalities,
  trackedSeries,
  isActive,
  onClick,
  isExpanded,
  displaySets,
  activeDisplaySetInstanceUIDs,
  onClickThumbnail,
  onDoubleClickThumbnail,
  onClickUntrack,
}) => {
  const { t } = useTranslation('StudyItem');
  return (
    <Accordion
      type="single"
      collapsible
      className={classnames('hover:bg-accent bg-popover border-bkg-low rounded border')}
      onClick={onClick}
      onKeyDown={onClick}
      role="button"
      tabIndex={0}
    >
      <AccordionItem value="study-item">
        <AccordionTrigger>
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
          {!!trackedSeries && (
            <div className="flex-2 flex">
              <div
                className={classnames(
                  'bg-secondary-main mt-2 flex flex-row py-1 pl-2 pr-4 text-base text-white',
                  isActive
                    ? 'border-secondary-light flex-1 justify-center border-t'
                    : 'mx-4 mb-4 rounded-sm'
                )}
              >
                <Icon
                  name="tracked"
                  className="text-primary-light mr-2 w-4"
                />
                {t('Tracked series', { trackedSeries: trackedSeries })}
              </div>
            </div>
          )}
        </AccordionTrigger>
        <AccordionContent>
          {isExpanded && displaySets && (
            <ThumbnailList
              thumbnails={displaySets}
              activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
              onThumbnailClick={onClickThumbnail}
              onThumbnailDoubleClick={onDoubleClickThumbnail}
              onClickUntrack={onClickUntrack}
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
};

export default StudyItem;

/**
 *    {isExpanded && displaySets && (
      <ThumbnailList
        thumbnails={displaySets}
        activeDisplaySetInstanceUIDs={activeDisplaySetInstanceUIDs}
        onThumbnailClick={onClickThumbnail}
        onThumbnailDoubleClick={onDoubleClickThumbnail}
        onClickUntrack={onClickUntrack}
      />
    )}
 */

/**
     *       <div className="flex flex-1 flex-col px-4 pb-2">
        <div className="flex flex-row items-center justify-between pt-2 pb-2">
          <div className="text-base text-white">{date}</div>
          <div className="flex flex-row items-center text-base text-blue-300">
            <Icon
              name="group-layers"
              className="mx-2 w-4 text-blue-300"
            />
            {numInstances}
          </div>
        </div>
        <div className="flex flex-row items-center py-1">
          <div className="text-l flex items-center pr-5 text-blue-300">{modalities}</div>
          <div className="flex items-center break-words text-base text-blue-300">{description}</div>
        </div>
      </div>
      {!!trackedSeries && (
        <div className="flex-2 flex">
          <div
            className={classnames(
              'bg-secondary-main mt-2 flex flex-row py-1 pl-2 pr-4 text-base text-white',
              isActive
                ? 'border-secondary-light flex-1 justify-center border-t'
                : 'mx-4 mb-4 rounded-sm'
            )}
          >
            <Icon
              name="tracked"
              className="text-primary-light mr-2 w-4"
            />
            {t('Tracked series', { trackedSeries: trackedSeries })}
          </div>
        </div>
      )}
     */
