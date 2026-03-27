import React, { useRef, useState, useLayoutEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { ThumbnailList } from '../ThumbnailList';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../Accordion';
import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';

// Estimation de la largeur d'un badge (Inter 11px semibold) : ~7px/car + 8px padding horizontal
const CHAR_PX = 7;
const BADGE_H_PAD = 8;
const BADGE_GAP = 5;
const estimateBadgeW = (text: string) => text.length * CHAR_PX + BADGE_H_PAD;
const OVERFLOW_BADGE_W = estimateBadgeW('+99') + BADGE_GAP;

const getModalityBg = (mod: string): string => {
  const m = (mod || '').trim().toUpperCase();
  if (m === 'CT') return '#8b5cf6';
  if (m === 'XR' || m === 'CR' || m === 'DX') return '#ec4899';
  if (m === 'MR') return '#3b82f6';
  if (m === 'US') return '#10b981';
  if (m === 'PT' || m === 'PET') return '#f59e0b';
  if (m === 'NM') return '#f97316';
  if (m === 'MG') return '#14b8a6';
  if (m === 'SR') return '#a78bfa';
  return '#6b7280';
};

const ModalityBadge = ({ mod }: { mod: string }) => (
  <span
    className="inline-flex shrink-0 items-center rounded px-1 py-[2px] font-['Inter'] text-[11px] font-semibold uppercase leading-tight text-white"
    style={{ backgroundColor: getModalityBg(mod) }}
  >
    {mod.trim().toUpperCase()}
  </span>
);

// Reçoit la largeur disponible calculée par le parent — pas de ResizeObserver interne
const OverflowModalityBadges = ({ mods, maxWidth }: { mods: string[]; maxWidth: number }) => {
  let cutAt = 0;
  let usedW = 0;
  for (let i = 0; i < mods.length; i++) {
    const bw = estimateBadgeW(mods[i]) + (i > 0 ? BADGE_GAP : 0);
    const wouldStillHaveMore = i < mods.length - 1;
    if (maxWidth > 0 && usedW + bw + (wouldStillHaveMore ? OVERFLOW_BADGE_W : 0) > maxWidth) break;
    usedW += bw;
    cutAt = i + 1;
  }

  const visible = mods.slice(0, cutAt);
  const hidden = mods.slice(cutAt);

  if (mods.length === 0) return null;

  return (
    <div className="flex shrink-0 items-center gap-[5px]">
      {visible.map(mod => (
        <ModalityBadge key={mod} mod={mod} />
      ))}
      {hidden.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex shrink-0 cursor-pointer items-center rounded bg-[#0076F7] px-1 py-[2px] font-['Inter'] text-[11px] font-semibold leading-tight text-white">
              +{hidden.length}
            </span>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="flex flex-wrap gap-1 p-1">
              {hidden.map(mod => (
                <ModalityBadge key={mod} mod={mod} />
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

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
  ThumbnailMenuItems,
  StudyMenuItems,
  StudyInstanceUID,
}: withAppTypes) => {
  const topRowRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLSpanElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const [badgesMaxW, setBadgesMaxW] = useState(0);

  const modalityList: string[] = modalities
    ? modalities.split(/[/\\]/).map((m: string) => m.trim()).filter(Boolean)
    : [];

  const seriesLabel = numInstances === 1 ? 'série' : 'séries';

  useLayoutEffect(() => {
    if (!topRowRef.current) return;
    const measure = () => {
      const rowW = topRowRef.current!.clientWidth;
      const dateW = dateRef.current?.offsetWidth ?? 0;
      const countW = countRef.current?.offsetWidth ?? 0;
      // Largeur dispo pour les badges = espace total - date - mr-[30px] - count - gap entre count et badges
      setBadgesMaxW(Math.max(0, rowW - dateW - 30 - countW - BADGE_GAP));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(topRowRef.current);
    measure();
    return () => ro.disconnect();
  }, []);

  return (
    <Accordion
      type="single"
      collapsible
      onClick={onClick}
      onKeyDown={() => {}}
      role="button"
      tabIndex={0}
      defaultValue={isActive ? 'study-item' : undefined}
    >
      <AccordionItem value="study-item">
        <AccordionTrigger
          className={classnames(
            'bg-popover group min-h-[47.5px] w-full rounded py-[3px] hover:bg-[#0076F7]/80',
            'items-center gap-[10px] px-3'
          )}
        >
          <div className="flex w-full flex-col gap-[4px]">
            {/* Ligne 1 : date (gauche) | count + badges (droite) */}
            <div ref={topRowRef} className="flex w-full items-center overflow-hidden">
              <span
                ref={dateRef}
                className="shrink-0 text-[13px] font-semibold text-[#D9D9D9]"
                style={{ marginRight: '30px' }}
              >
                {date}
              </span>
              <div className="ml-auto flex shrink-0 items-center gap-[5px]">
                <span
                  ref={countRef}
                  className="shrink-0 font-['Inter'] text-[12px] font-medium text-[#D9D9D9]"
                >
                  {numInstances} {seriesLabel}
                </span>
                <OverflowModalityBadges mods={modalityList} maxWidth={badgesMaxW} />
              </div>
            </div>
            {/* Ligne 2 : description */}
            {description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full cursor-pointer overflow-hidden truncate whitespace-nowrap text-left text-[12px] text-white">
                    {description}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" align="start" className="max-w-xs">
                  {description}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {StudyMenuItems && (
            <div className="flex shrink-0 items-center">
              <StudyMenuItems StudyInstanceUID={StudyInstanceUID} />
            </div>
          )}
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
              ThumbnailMenuItems={ThumbnailMenuItems}
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
  modalities: PropTypes.string,
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
};

export { StudyItem };
