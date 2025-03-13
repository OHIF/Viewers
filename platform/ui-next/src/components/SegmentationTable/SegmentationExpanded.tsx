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

// New internal components that will hold the context for each section
const SegmentationExpandedHeader = ({ children }) => {
  const { segmentation, isActive, onSegmentationClick } = useSegmentationExpanded(
    'SegmentationExpandedHeader'
  );

  return (
    <PanelSection.Header
      className={`border-input border-t-2 bg-transparent pl-1 ${isActive ? 'border-primary' : ''} py-0`}
      onClick={e => {
        e.stopPropagation();
        onSegmentationClick(segmentation.segmentationId);
      }}
    >
      <div className="text-foreground flex h-8 w-full items-center justify-between">
        <div className="flex items-center space-x-1">
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
          <div className="pl-1.5">{segmentation.label}</div>
        </div>
        <div className="mr-1 flex items-center">
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
      </div>
    </PanelSection.Header>
  );
};

const SegmentationExpandedContent = ({ children }) => {
  return (
    <PanelSection.Content className="py-0">
      <div className="segmentation-expanded-section">{children}</div>
    </PanelSection.Content>
  );
};

// Main compound component
export const SegmentationExpanded = ({ children }) => {
  const { data, activeSegmentationId, onSegmentationClick, mode } =
    useSegmentationTableContext('SegmentationExpanded');

  // Check if we should render based on mode
  if (mode !== 'expanded' || !data || data.length === 0) {
    return null;
  }

  return (
    <div className="space-y-0">
      {data.map(segmentationInfo => {
        const isActive = segmentationInfo.segmentation.segmentationId === activeSegmentationId;

        return (
          <PanelSection
            key={segmentationInfo.segmentation.segmentationId}
            className="mb-0"
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
  );
};

// Add the subcomponents to the main component
SegmentationExpanded.Header = SegmentationExpandedHeader;
SegmentationExpanded.Content = SegmentationExpandedContent;

// Export the component
export default SegmentationExpanded;
