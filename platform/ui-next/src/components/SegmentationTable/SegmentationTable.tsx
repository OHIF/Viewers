import React, { ReactNode, useState, Children, isValidElement, cloneElement } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection';
import { SegmentationTableProvider } from './contexts';
import { SegmentationSegments } from './SegmentationSegments';
import { SegmentStatistics } from './SegmentStatistics';
import { SegmentationTableConfig } from './SegmentationTableConfig';
import { AddSegmentRow } from './AddSegmentRow';
import { AddSegmentationRow } from './AddSegmentationRow';
import { SegmentationHeader } from './SegmentationHeader';
import { SegmentationCollapsed } from './SegmentationCollapsed';
import { SegmentationExpanded } from './SegmentationExpanded';
import Icons from '../Icons';

interface SegmentationTableProps {
  disabled?: boolean;
  title?: string;
  children?: ReactNode;
  data: any[];
  mode: 'collapsed' | 'expanded';
  fillAlpha?: number;
  exportOptions?: any[];
  showConfig?: boolean;
  fillAlphaInactive?: number;
  outlineWidth?: number;
  renderFill?: boolean;
  renderOutline?: boolean;
  setShowConfig?: (value: boolean) => void;
  activeSegmentationId?: string;
  activeRepresentation?: any;
  activeSegmentation?: any;
  disableEditing?: boolean;
  showAddSegment?: boolean;
  renderInactiveSegmentations?: boolean;

  // Function handlers
  setRenderFill?: ({ type }: { type: string }, value: boolean) => void;
  setRenderOutline?: ({ type }: { type: string }, value: boolean) => void;
  setOutlineWidth?: ({ type }: { type: string }, value: number) => void;
  setFillAlpha?: ({ type }: { type: string }, value: number) => void;
  setFillAlphaInactive?: ({ type }: { type: string }, value: number) => void;
  toggleRenderInactiveSegmentations?: () => void;
  onSegmentationAdd?: (segmentationId: string) => void;
  onSegmentationClick?: (segmentationId: string) => void;
  onSegmentationDelete?: (segmentationId: string) => void;
  onSegmentAdd?: (segmentationId: string) => void;
  onSegmentClick?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentEdit?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentationEdit?: (segmentationId: string) => void;
  onSegmentColorClick?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentDelete?: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentVisibility?: (
    segmentationId: string,
    segmentIndex: number,
    representationType?: string
  ) => void;
  onToggleSegmentLock?: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentationRepresentationVisibility?: (segmentationId: string, type: string) => void;
  onSegmentationDownload?: (segmentationId: string) => void;
  storeSegmentation?: (segmentationId: string) => void;
  onSegmentationDownloadRTSS?: (segmentationId: string) => void;
  setStyle?: (
    segmentationId: string,
    representationType: string,
    styleKey: string,
    value: unknown
  ) => void;
  onSegmentationRemoveFromViewport?: (segmentationId: string) => void;
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
  SegmentStatistics: typeof SegmentStatistics;
}

export const SegmentationTableRoot: SegmentationTableComponent = (
  props: SegmentationTableProps
) => {
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
                className="text-primary-active h-4 w-4"
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
});

export { SegmentationTable };
