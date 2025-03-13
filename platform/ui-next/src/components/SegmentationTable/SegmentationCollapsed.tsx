import React from 'react';
import { PanelSection } from '../PanelSection';
import { useSegmentationTableContext, SegmentationExpandedProvider } from './contexts';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Icons,
  DropdownMenu,
  DropdownMenuTrigger,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '../../components';

// Main header component
const SegmentationCollapsedHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="bg-primary-dark flex h-10 w-full items-center space-x-1 rounded-t px-1.5">
      {children}
    </div>
  );
};

// Dropdown menu component - specifically for dropdown menu content
const SegmentationCollapsedDropdownMenu = ({ children }: { children: React.ReactNode }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <Icons.More className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      {children}
    </DropdownMenu>
  );
};

// Selector component - for the segmentation selection dropdown
const SegmentationCollapsedSelector = () => {
  const { t } = useTranslation('SegmentationTable.HeaderCollapsed');
  const { data, activeSegmentationId, onSegmentationClick } = useSegmentationTableContext(
    'SegmentationCollapsedSelector'
  );

  if (!data?.length) {
    return null;
  }

  const segmentations = data.map(seg => ({
    id: seg.segmentation.segmentationId,
    label: seg.segmentation.label,
  }));

  return (
    <Select
      onValueChange={value => onSegmentationClick(value)}
      value={activeSegmentationId}
    >
      <SelectTrigger className="w-full overflow-hidden">
        <SelectValue placeholder={t('Select a segmentation')} />
      </SelectTrigger>
      <SelectContent>
        {segmentations.map(seg => (
          <SelectItem
            key={seg.id}
            value={seg.id}
          >
            {seg.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

// Info component - for displaying the info tooltip
const SegmentationCollapsedInfo = () => {
  const { data, activeSegmentationId } = useSegmentationTableContext('SegmentationCollapsedInfo');

  const activeSegmentationObj = data.find(
    seg => seg.segmentation.segmentationId === activeSegmentationId
  );

  const info = activeSegmentationObj?.segmentation.cachedStats?.info;

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
        >
          <Icons.Info className="h-6 w-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        align="end"
      >
        {info}
      </TooltipContent>
    </Tooltip>
  );
};

// Content component - for the main collapsed view content
const SegmentationCollapsedContent = ({ children }: { children: React.ReactNode }) => {
  return <div className="collapsed-content">{children}</div>;
};

// Main compound component
const SegmentationCollapsedRoot: React.FC<{ children?: React.ReactNode }> = ({
  children = null,
}) => {
  const { mode, data, activeSegmentationId } = useSegmentationTableContext('SegmentationCollapsed');

  // Check if we should render based on mode
  if (mode !== 'collapsed' || !data || data.length === 0) {
    return null;
  }

  // Find active segmentation
  const activeSegmentationInfo = data.find(
    info => info.segmentation.segmentationId === activeSegmentationId
  );

  if (!activeSegmentationInfo) {
    return null;
  }

  return (
    <div className="space-y-0">
      <PanelSection className="mb-0">
        <SegmentationExpandedProvider
          segmentation={activeSegmentationInfo.segmentation}
          representation={activeSegmentationInfo.representation}
          isActive={true}
          onSegmentationClick={() => {}} // No-op since it's already the active one
        >
          {children}
        </SegmentationExpandedProvider>
      </PanelSection>
    </div>
  );
};

// Add the subcomponents to the main component
const SegmentationCollapsed = Object.assign(SegmentationCollapsedRoot, {
  Header: SegmentationCollapsedHeader,
  DropdownMenu: SegmentationCollapsedDropdownMenu,
  Selector: SegmentationCollapsedSelector,
  Info: SegmentationCollapsedInfo,
  Content: SegmentationCollapsedContent,
});

// Export the component
export { SegmentationCollapsed };
