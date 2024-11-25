import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection';
import { SegmentationTableProvider, SegmentationTableContext } from './SegmentationTableContext';
import { SegmentationSegments } from './SegmentationSegments';
import { SegmentationTableConfig } from './SegmentationTableConfig';
import { AddSegmentRow } from './AddSegmentRow';
import { AddSegmentationRow } from './AddSegmentationRow';
import { SegmentationSelectorHeader } from './SegmentationSelectorHeader';
import { SegmentationHeader } from './SegmentationHeader';
import { SegmentationCollapsed } from './SegmentationCollapsed';
import { SegmentationExpanded } from './SegmentationExpanded';

interface SegmentationTableProps extends SegmentationTableContext {
  disabled?: boolean;
  title?: string;
  children?: ReactNode;
}

interface SegmentationTableComponent extends React.FC<SegmentationTableProps> {
  Segments: typeof SegmentationSegments;
  Config: typeof SegmentationTableConfig;
  AddSegmentRow: typeof AddSegmentRow;
  AddSegmentationRow: typeof AddSegmentationRow;
  SelectorHeader: typeof SegmentationSelectorHeader;
  Header: typeof SegmentationHeader;
  Collapsed: typeof SegmentationCollapsed;
  Expanded: typeof SegmentationExpanded;
}

export const SegmentationTable: SegmentationTableComponent = (props: SegmentationTableProps) => {
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
          <span>{t(title)}</span>
        </PanelSection.Header>
        <PanelSection.Content>{children}</PanelSection.Content>
      </PanelSection>
    </SegmentationTableProvider>
  );
};

SegmentationTable.Segments = SegmentationSegments;
SegmentationTable.Config = SegmentationTableConfig;
SegmentationTable.AddSegmentRow = AddSegmentRow;
SegmentationTable.AddSegmentationRow = AddSegmentationRow;
SegmentationTable.SelectorHeader = SegmentationSelectorHeader;
SegmentationTable.Header = SegmentationHeader;
SegmentationTable.Collapsed = SegmentationCollapsed;
SegmentationTable.Expanded = SegmentationExpanded;
