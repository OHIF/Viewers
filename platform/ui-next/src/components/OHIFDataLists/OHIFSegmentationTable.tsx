import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection';

import { SegmentationTableProvider } from './SegmentationTableContext';
import { SegmentationSegments } from './SegmentationSegments';
import { SegmentationTableConfig } from './SegmentationTableConfig';
import { AddSegmentRow } from './AddSegmentRow';
import { AddSegmentationRow } from './AddSegmentationRow';
import { SegmentationSelectorHeader } from './SegmentationSelectorHeader';
import { SegmentationHeader } from './SegmentationHeader';
import { SegmentationCollapsed } from './SegmentationCollapsed';
import { SegmentationExpanded } from './SegmentationExpanded';

interface ViewportSegmentationInfo {
  segmentation: any;
  representation: any;
}

interface OHIFSegmentationTableProps {
  data?: ViewportSegmentationInfo[];
  mode?: 'collapsed' | 'expanded';
  title?: string;
  children?: ReactNode;
  disableEditing?: boolean;
  disabled?: boolean;
  [key: string]: any; // Additional dynamic props
}

/**
 * The main "OHIFSegmentationTable" component that provides a context for
 * child segments, configs, and row-add features.
 */
export function OHIFSegmentationTable(props: OHIFSegmentationTableProps) {
  const { t } = useTranslation('SegmentationTable');
  const { data = [], mode, title, disableEditing, disabled, children, ...contextProps } = props;

  const activeSegmentationInfo = data.find(info => info.representation?.active);

  const activeSegmentationId = activeSegmentationInfo?.segmentation?.segmentationId;
  const activeRepresentation = activeSegmentationInfo?.representation;
  const activeSegmentation = activeSegmentationInfo?.segmentation;
  const { fillAlpha, fillAlphaInactive, outlineWidth, renderFill, renderOutline } =
    activeRepresentation?.styles ?? {};

  return (
    <SegmentationTableProvider
      data={data}
      mode={mode}
      disabled={disabled}
      disableEditing={disableEditing}
      fillAlpha={fillAlpha}
      fillAlphaInactive={fillAlphaInactive}
      outlineWidth={outlineWidth}
      renderFill={renderFill}
      renderOutline={renderOutline}
      activeSegmentationId={activeSegmentationId}
      activeSegmentation={activeSegmentation}
      activeRepresentation={activeRepresentation}
      {...contextProps}
    >
      <PanelSection defaultOpen={true}>
        <PanelSection.Header>
          <span>{t(title || '')}</span>
        </PanelSection.Header>
        <PanelSection.Content>{children}</PanelSection.Content>
      </PanelSection>
    </SegmentationTableProvider>
  );
}

/** Sub-Component Attachments */
OHIFSegmentationTable.Segments = SegmentationSegments;
OHIFSegmentationTable.Config = SegmentationTableConfig;
OHIFSegmentationTable.AddSegmentRow = AddSegmentRow;
OHIFSegmentationTable.AddSegmentationRow = AddSegmentationRow;
OHIFSegmentationTable.SelectorHeader = SegmentationSelectorHeader;
OHIFSegmentationTable.Header = SegmentationHeader;
OHIFSegmentationTable.Collapsed = SegmentationCollapsed;
OHIFSegmentationTable.Expanded = SegmentationExpanded;
