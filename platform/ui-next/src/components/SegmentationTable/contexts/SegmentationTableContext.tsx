import React, { createContext, useContext } from 'react';

export interface SegmentStats {
  info: string;
  namedStats?: Record<string, number | string>;
}

export interface Segment {
  color?: string;
  label: string;
  segmentIndex: number;
  visible?: boolean;
  locked?: boolean;
}

export interface Segmentation {
  segmentationId: string;
  label: string;
  cachedStats: SegmentStats;
  segments: Record<number, Segment>;
}

export interface RepresentationStyles {
  fillAlpha: number;
  fillAlphaInactive: number;
  outlineWidth: number;
  renderFill: boolean;
  renderOutline: boolean;
}

export interface Representation {
  active: boolean;
  visible: boolean;
  type: string;
  segments: Record<number, Segment>;
  styles: RepresentationStyles;
}

export interface ViewportSegmentationInfo {
  segmentation: Segmentation;
  representation: Representation;
}

export interface ExportOption {
  segmentationId: string;
  isExportable: boolean;
}

export interface SegmentationTableContextType {
  data: ViewportSegmentationInfo[];
  disabled: boolean;
  mode: 'collapsed' | 'expanded';
  fillAlpha: number;
  exportOptions?: ExportOption[];
  showConfig: boolean;
  fillAlphaInactive: number;
  outlineWidth: number;
  renderFill: boolean;
  renderOutline: boolean;
  activeSegmentationId?: string;
  activeRepresentation?: Representation;
  activeSegmentation?: Segmentation;
  disableEditing: boolean;
  showAddSegment?: boolean;
  showSegmentIndex?: boolean;
  renderInactiveSegmentations?: boolean;

  // Function handlers
  setShowConfig?: (show: boolean) => void;
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

const SegmentationTableContext = createContext<SegmentationTableContextType | undefined>(undefined);
SegmentationTableContext.displayName = 'SegmentationTableContext';

export const SegmentationTableProvider = ({
  value,
  children,
}: {
  value: SegmentationTableContextType;
  children: React.ReactNode;
}) => {
  return (
    <SegmentationTableContext.Provider value={value}>{children}</SegmentationTableContext.Provider>
  );
};

export const useSegmentationTableContext = (componentName?: string) => {
  const context = useContext(SegmentationTableContext);

  if (context === undefined) {
    throw new Error(
      `useSegmentationTableContext must be used within a SegmentationTableProvider` +
        (componentName ? ` (called from ${componentName})` : '')
    );
  }

  return context;
};
