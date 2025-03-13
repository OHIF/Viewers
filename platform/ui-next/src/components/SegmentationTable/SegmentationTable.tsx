import React, { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection';
import { SegmentationTableProvider, SegmentationTableContext } from './SegmentationTableContext';
import { SegmentationSegments } from './SegmentationSegments';
import {
  SegmentStatisticsTitle,
  SegmentStatisticsHeader,
  SegmentStatisticsBody,
  SegmentStatisticsFooter,
} from './SegmentStatistics';
import { SegmentationTableConfig } from './SegmentationTableConfig';
import { AddSegmentRow } from './AddSegmentRow';
import { AddSegmentationRow } from './AddSegmentationRow';
import { SegmentationSelectorHeader } from './SegmentationSelectorHeader';
import { SegmentationHeader } from './SegmentationHeader';
import { SegmentationCollapsed } from './SegmentationCollapsed';
import { SegmentationExpanded } from './SegmentationExpanded';
import Icons from '../Icons';

interface SegmentationTableProps extends SegmentationTableContext {
  disabled?: boolean;
  title?: string;
  children?: ReactNode;
}

// Create a wrapper component for SegmentStatistics to expose it via SegmentationTable.SegmentStatistics
const SegmentStatisticsWrapper = ({ children }) => {
  return children;
};
SegmentStatisticsWrapper.displayName = 'SegmentationTable.SegmentStatistics';

interface SegmentationTableComponent extends React.FC<SegmentationTableProps> {
  Segments: typeof SegmentationSegments;
  Config: typeof SegmentationTableConfig;
  AddSegmentRow: typeof AddSegmentRow;
  AddSegmentationRow: typeof AddSegmentationRow;
  SelectorHeader: typeof SegmentationSelectorHeader;
  Header: typeof SegmentationHeader;
  Collapsed: typeof SegmentationCollapsed;
  Expanded: typeof SegmentationExpanded;
  SegmentStatistics: typeof SegmentStatisticsWrapper;
  SegmentStatisticsTitle: typeof SegmentStatisticsTitle;
  SegmentStatisticsHeader: typeof SegmentStatisticsHeader;
  SegmentStatisticsBody: typeof SegmentStatisticsBody;
  SegmentStatisticsFooter: typeof SegmentStatisticsFooter;
}

export const SegmentationTable: SegmentationTableComponent = (props: SegmentationTableProps) => {
  const { t } = useTranslation('SegmentationTable');
  const { data = [], mode, title, disableEditing, disabled, children, ...contextProps } = props;
  const [showConfig, setShowConfig] = useState(false);

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
      showConfig={showConfig}
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
        <PanelSection.Header className="flex items-center justify-between">
          <span>{t(title)}</span>
          <div className="ml-auto mr-2">
            <Icons.Settings
              className="text-primary-active h-4 w-4"
              onClick={e => {
                e.stopPropagation();
                setShowConfig(!showConfig);
              }}
            />
          </div>
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
SegmentationTable.SegmentStatistics = SegmentStatisticsWrapper;
SegmentationTable.SegmentStatisticsTitle = SegmentStatisticsTitle;
SegmentationTable.SegmentStatisticsHeader = SegmentStatisticsHeader;
SegmentationTable.SegmentStatisticsBody = SegmentStatisticsBody;
SegmentationTable.SegmentStatisticsFooter = SegmentStatisticsFooter;
