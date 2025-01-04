import { createContext } from '../../lib/createContext';

interface Segmentation {
  segmentationId: string;
  label: string;
  cachedStats: {
    info: string;
  };
}

interface Representation {
  active: boolean;
  visible: boolean;
  type: string;
  styles: {
    fillAlpha: number;
    fillAlphaInactive: number;
    outlineWidth: number;
    renderFill: boolean;
    renderOutline: boolean;
  };
  segments?: Record<number, any>;
}

interface ViewportSegmentationInfo {
  segmentation: Segmentation;
  representation: Representation;
}

interface SegmentationTableContext {
  data: ViewportSegmentationInfo[];
  disabled: boolean;
  mode: 'collapsed' | 'expanded';
  fillAlpha: number;
  exportOptions?: {
    segmentationId: string;
    isExportable: boolean;
  }[];
  fillAlphaInactive: number;
  outlineWidth: number;
  renderFill: boolean;
  renderOutline: boolean;
  activeSegmentationId: string;
  activeRepresentation: Representation;
  activeSegmentation: Segmentation;
  setRenderFill: (args: { type: string }, value: boolean) => void;
  setRenderOutline: (args: { type: string }, value: boolean) => void;
  setOutlineWidth: (args: { type: string }, value: number) => void;
  setFillAlpha: (args: { type: string }, value: number) => void;
  setFillAlphaInactive: (args: { type: string }, value: number) => void;
  renderInactiveSegmentations?: boolean;
  toggleRenderInactiveSegmentations?: () => void;
  onSegmentationAdd?: (segmentationId: string) => void;
  onSegmentationClick?: (segmentationId: string) => void;
  onSegmentationDelete?: (segmentationId: string) => void;
  showAddSegment?: boolean;
  onSegmentAdd?: (segmentationId: string) => void;
  onSegmentClick?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentEdit?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentationEdit?: (segmentationId: string) => void;
  onSegmentColorClick?: (segmentationId: string, segmentIndex: number) => void;
  onSegmentDelete?: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentVisibility?: (segmentationId: string, segmentIndex: number, type: string) => void;
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
  disableEditing?: boolean;
}

const [SegmentationTableProvider, useSegmentationTableContext] =
  createContext<SegmentationTableContext>('SegmentationTable');

export { SegmentationTableProvider, useSegmentationTableContext };
