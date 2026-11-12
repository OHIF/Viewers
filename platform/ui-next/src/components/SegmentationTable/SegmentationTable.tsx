import React, { ReactNode, useState, Children, isValidElement } from 'react';
import { useTranslation } from 'react-i18next';
import { PanelSection } from '../PanelSection';
import {
  SegmentationTableProvider,
  SegmentationTableContextType,
} from './contexts/SegmentationTableContext';
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

/**
 * Returns `fallback` only when `value` is `undefined`, matching the semantics of
 * a destructuring default (which `??` does not - it also replaces `null`).
 */
function pick<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

export const SegmentationTableRoot = (props: SegmentationTableProps) => {
  const { t } = useTranslation('SegmentationPanel');
  const {
    data = [],
    mode,
    title,
    disableEditing = false,
    disabled = false,
    children,
    showConfig: externalShowConfig,
    selectedSegmentationIdForType,
    segmentationRepresentationTypes,
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

  const selectedSegmentationForTypeInfo = data.find(
    info => info.segmentation?.segmentationId === selectedSegmentationIdForType
  );
  const selectedSegmentationForTypeRepresentation = selectedSegmentationForTypeInfo?.representation;

  // Extract style properties or use defaults. These were destructuring defaults,
  // which the compiler cannot reorder; `pick` keeps the same rule - a default
  // applies only when the value is `undefined`, never when it is `null`.
  const styles = selectedSegmentationForTypeRepresentation?.styles ?? {};
  const fillAlpha = pick(styles.fillAlpha, props.fillAlpha || 0.5);
  const fillAlphaInactive = pick(styles.fillAlphaInactive, props.fillAlphaInactive || 0.2);
  const outlineWidth = pick(styles.outlineWidth, props.outlineWidth || 1);
  const renderFill = pick(styles.renderFill, pick(props.renderFill, true));
  const renderOutline = pick(styles.renderOutline, pick(props.renderOutline, true));

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

  const dataCyTypeSuffix = segmentationRepresentationTypes
    ? `-${segmentationRepresentationTypes[0]}`
    : '';

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
        selectedSegmentationIdForType,
        segmentationRepresentationTypes,
        ...contextProps,
        setShowConfig: toggleShowConfig,
      }}
    >
      <PanelSection defaultOpen={true}>
        <PanelSection.Header className="flex items-center justify-between">
          <span>{t(title)}</span>
          {hasConfigComponent && (
            <div
              className="ml-auto mr-2"
              data-cy={`segmentation-config-toggle${dataCyTypeSuffix}`}
            >
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
