import React from 'react';
import { PanelSection } from '../PanelSection';
import {
  useSegmentationTableContext,
  SegmentationExpandedProvider,
  useSegmentationExpanded,
} from './contexts';
import { Button } from '../Button';
import { Icons } from '../Icons/Icons';
import { DropdownMenu, DropdownMenuTrigger } from '../DropdownMenu';
import { Tooltip, TooltipTrigger, TooltipContent } from '../Tooltip/Tooltip';
import { ScrollArea } from '../../components';
import { useDynamicMaxHeight } from '../../hooks/useDynamicMaxHeight';

// The Header container component
const SegmentationExpandedHeader = ({ children }: { children: React.ReactNode }) => {
  const { segmentation, isActive } = useSegmentationExpanded('SegmentationExpandedHeader');
  const { onSegmentationClick } = useSegmentationTableContext('SegmentationExpandedHeader');

  return (
    <PanelSection.Header
      className={`bg-muted my-0 rounded-none border-l-[2px] pl-0 ${isActive ? 'border-primary/70' : 'border-primary/35'}`}
      onClick={e => {
        e.stopPropagation();
        onSegmentationClick(segmentation.segmentationId);
      }}
    >
      <div className="text-foreground flex h-8 w-full items-center">{children}</div>
    </PanelSection.Header>
  );
};

// Dropdown menu component - specifically for dropdown menu content
const SegmentationExpandedDropdownMenu = ({ children }: { children: React.ReactNode }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="ml-1"
          onClick={e => e.stopPropagation()}
        >
          <Icons.More />
        </Button>
      </DropdownMenuTrigger>
      {children}
    </DropdownMenu>
  );
};

// Label component - for displaying the segmentation label
const SegmentationExpandedLabel = () => {
  const { segmentation } = useSegmentationExpanded('SegmentationExpandedLabel');

  return <div className="pl-1.5">{segmentation.label}</div>;
};

// Info component - for the info tooltip
const SegmentationExpandedInfo = () => {
  const { segmentation } = useSegmentationExpanded('SegmentationExpandedInfo');

  return (
    <div className="ml-auto mr-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
          >
            <Icons.Info className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{segmentation.cachedStats?.info}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

// Content component
const SegmentationExpandedContent = ({ children }: { children: React.ReactNode }) => {
  const { isActive } = useSegmentationExpanded('SegmentationExpandedContent');
  return (
    <PanelSection.Content
      className={`border-l-[2px] py-0 pb-6 pl-[8px] ${isActive ? 'border-primary/70' : 'border-primary/35'}`}
    >
      <div className="segmentation-expanded-section">{children}</div>
    </PanelSection.Content>
  );
};

// Main compound component
const SegmentationExpandedRoot = ({ children }) => {
  const { data, activeSegmentationId, onSegmentationClick, mode } =
    useSegmentationTableContext('SegmentationExpanded');

  const { ref: scrollableContainerRef, maxHeight } = useDynamicMaxHeight(data);

  // Check if we should render based on mode
  if (mode !== 'expanded' || !data || data.length === 0) {
    return null;
  }

  return (
    <ScrollArea
      className={`bg-bkg-low space-y-px`}
      showArrows={true}
    >
      <div
        ref={scrollableContainerRef}
        style={{ maxHeight: maxHeight }}
        className={`space-y-0 pl-0.5`}
      >
        {data.map(segmentationInfo => {
          const isActive = segmentationInfo.segmentation.segmentationId === activeSegmentationId;

          return (
            <PanelSection
              key={segmentationInfo.segmentation.segmentationId}
              className=""
            >
              <SegmentationExpandedProvider
                segmentation={segmentationInfo.segmentation}
                representation={segmentationInfo.representation}
                isActive={isActive}
                onSegmentationClick={onSegmentationClick}
              >
                {children}
              </SegmentationExpandedProvider>
            </PanelSection>
          );
        })}
      </div>
    </ScrollArea>
  );
};

const SegmentationExpanded = Object.assign(SegmentationExpandedRoot, {
  Header: SegmentationExpandedHeader,
  DropdownMenu: SegmentationExpandedDropdownMenu,
  Label: SegmentationExpandedLabel,
  Info: SegmentationExpandedInfo,
  Content: SegmentationExpandedContent,
});

export { SegmentationExpanded };
