import React from 'react';
import { PanelSection } from '../PanelSection';
import {
  useSegmentationTableContext,
  SegmentationExpandedProvider,
  useSegmentationExpanded,
} from './contexts';
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
  const { data, onSegmentationClick, segmentationRepresentationType } = useSegmentationTableContext(
    'SegmentationCollapsedSelector'
  );
  const { segmentation } = useSegmentationExpanded('SegmentationCollapsedSelector');

  if (!data?.length) {
    return null;
  }

  const segmentations = data
    // Only show segmentations of the representation type for this panel. Show all segmentations if no type is specified.
    .filter(
      seg =>
        !segmentationRepresentationType ||
        segmentationRepresentationType === seg.representation.type
    )
    .map(seg => ({
      id: seg.segmentation.segmentationId,
      label: seg.segmentation.label,
    }));

  return (
    <Select
      onValueChange={value => onSegmentationClick(value)}
      value={segmentation?.segmentationId}
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
  const { mode, data, segmentationRepresentationType, selectedSegmentationIdForType } =
    useSegmentationTableContext('SegmentationCollapsed');

  // Find the segmentations for the representation type for this collapsed view.
  const segmentations = data.filter(
    segmentation =>
      !segmentationRepresentationType ||
      segmentationRepresentationType === segmentation.representation?.type
  );

  // Check if we should render.
  if (mode !== 'collapsed' || !data || data.length === 0 || segmentations.length === 0) {
    return null;
  }

  // Find the selected segmentation info for the representation type, or default to the first one.
  const selectedSegmentationInfo =
    segmentations.find(
      segmentation => segmentation.segmentation.segmentationId === selectedSegmentationIdForType
    ) ?? segmentations[0];

  return (
    <div className="space-y-0">
      <PanelSection className="mb-0">
        <SegmentationExpandedProvider
          segmentation={selectedSegmentationInfo.segmentation}
          representation={selectedSegmentationInfo.representation}
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
