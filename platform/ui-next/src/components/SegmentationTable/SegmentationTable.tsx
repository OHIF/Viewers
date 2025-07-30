import React, { ReactNode, useState, Children, isValidElement } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection';
import { SegmentationTableProvider, SegmentationTableContextType } from './contexts';
import { SegmentationSegments } from './SegmentationSegments';
import { SegmentStatistics } from './SegmentStatistics';
import { SegmentationTableConfig } from './SegmentationTableConfig';
import { AddSegmentRow } from './AddSegmentRow';
import { AddSegmentationRow } from './AddSegmentationRow';
import { SegmentationHeader } from './SegmentationHeader';
import { SegmentationCollapsed } from './SegmentationCollapsed';
import { SegmentationExpanded } from './SegmentationExpanded';
import Icons from '../Icons';

// Only include props that aren't part of the context
interface SegmentationTableProps extends Omit<SegmentationTableContextType, 'setShowConfig'> {
  title?: string;
  children?: ReactNode;
  setShowConfig?: (value: boolean) => void;
}

interface SegmentationTableComponent extends React.FC<SegmentationTableProps> {
  Segments: typeof SegmentationSegments;
  Config: typeof SegmentationTableConfig;
  AddSegmentRow: typeof AddSegmentRow;
  AddSegmentationRow: typeof AddSegmentationRow;
  Header: typeof SegmentationHeader;
  Collapsed: typeof SegmentationCollapsed;
  Expanded: typeof SegmentationExpanded;
  SegmentStatistics: typeof SegmentStatistics;
}

export const SegmentationTableRoot = (props: SegmentationTableProps) => {
  const { t } = useTranslation('SegmentationTable');
  const {
    data = [],
    mode,
    title,
    disableEditing = false,
    disabled = false,
    children,
    showConfig: externalShowConfig,
    ...contextProps
  } = props;

  const [internalShowConfig, setInternalShowConfig] = useState(false);
  const showConfig = externalShowConfig !== undefined ? externalShowConfig : internalShowConfig;

  // Find the active segmentation info based on which representation is active
  const activeSegmentationInfo = data.find(info => info.representation?.active);

  // Get the active segmentation ID
  const activeSegmentationId =
    props.activeSegmentationId || activeSegmentationInfo?.segmentation?.segmentationId;
  const activeRepresentation = props.activeRepresentation || activeSegmentationInfo?.representation;
  const activeSegmentation = props.activeSegmentation || activeSegmentationInfo?.segmentation;

  // Extract style properties or use defaults
  const {
    fillAlpha = props.fillAlpha || 0.5,
    fillAlphaInactive = props.fillAlphaInactive || 0.2,
    outlineWidth = props.outlineWidth || 1,
    renderFill = props.renderFill !== undefined ? props.renderFill : true,
    renderOutline = props.renderOutline !== undefined ? props.renderOutline : true,
  } = activeRepresentation?.styles ?? {};

  // Check if SegmentationTableConfig is present in children
  const hasConfigComponent = Children.toArray(children).some(
    child => isValidElement(child) && child.type === SegmentationTableConfig
  );

  // Process children to conditionally render the config component based on showConfig
  const processedChildren = Children.map(children, child => {
    if (isValidElement(child) && child.type === SegmentationTableConfig) {
      // Only render the Config component if showConfig is true
      return showConfig ? child : null;
    }
    return child;
  });

  const toggleShowConfig = () => {
    if (props.setShowConfig) {
      props.setShowConfig(!showConfig);
    } else {
      setInternalShowConfig(!internalShowConfig);
    }
  };

  return (
    <SegmentationTableProvider
      value={{
        data,
        mode,
        showConfig,
        disabled,
        disableEditing,
        fillAlpha,
        fillAlphaInactive,
        outlineWidth,
        renderFill,
        renderOutline,
        activeSegmentationId,
        activeSegmentation,
        activeRepresentation,
        ...contextProps,
        setShowConfig: toggleShowConfig,
      }}
    >
      <PanelSection defaultOpen={true}>
        <PanelSection.Header className="flex items-center justify-between">
          <span>{t(title)}</span>
          {hasConfigComponent && (
            <div className="ml-auto mr-2">
              <Icons.Settings
                className="text-primary h-4 w-4"
                onClick={e => {
                  e.stopPropagation();
                  toggleShowConfig();
                }}
              />
            </div>
          )}
        </PanelSection.Header>
        <PanelSection.Content>{processedChildren}</PanelSection.Content>
      </PanelSection>
    </SegmentationTableProvider>
  );
};

const SegmentationTable = Object.assign(SegmentationTableRoot, {
  Segments: SegmentationSegments,
  Config: SegmentationTableConfig,
  AddSegmentRow: AddSegmentRow,
  AddSegmentationRow: AddSegmentationRow,
  Collapsed: SegmentationCollapsed,
  Expanded: SegmentationExpanded,
  SegmentStatistics: SegmentStatistics,
  Header: SegmentationHeader,
}) as SegmentationTableComponent;

export { SegmentationTable };
