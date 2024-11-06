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
  exportOptions: {
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
  setRenderFill: ({ type }, value: boolean) => void;
  setRenderOutline: ({ type }, value: boolean) => void;
  setOutlineWidth: ({ type }, value: number) => void;
  setFillAlpha: ({ type }, value: number) => void;
  setFillAlphaInactive: ({ type }, value: number) => void;
  renderInactiveSegmentations: boolean;
  toggleRenderInactiveSegmentations: () => void;
  onSegmentationAdd: (segmentationId: string) => void;
  onSegmentationClick: (segmentationId: string) => void;
  onSegmentationDelete: (segmentationId: string) => void;
  onSegmentAdd: (segmentationId: string) => void;
  onSegmentClick: (segmentationId: string, segmentIndex: number) => void;
  onSegmentEdit: (segmentationId: string, segmentIndex: number) => void;
  onSegmentationEdit: (segmentationId: string) => void;
  onSegmentColorClick: (segmentationId: string, segmentIndex: number) => void;
  onSegmentDelete: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentVisibility: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentLock: (segmentationId: string, segmentIndex: number) => void;
  onToggleSegmentationRepresentationVisibility: (segmentationId: string, type: string) => void;
  onSegmentationDownload: (segmentationId: string) => void;
  storeSegmentation: (segmentationId: string) => void;
  onSegmentationDownloadRTSS: (segmentationId: string) => void;
  setStyle: (
    segmentationId: string,
    representationType: string,
    styleKey: string,
    value: unknown
  ) => void;
  onSegmentationRemoveFromViewport: (segmentationId: string) => void;
  disableEditing: boolean;
}

const [SegmentationTableProvider, useSegmentationTableContext] =
  createContext<SegmentationTableContext>('SegmentationTable');

export { SegmentationTableProvider, useSegmentationTableContext, SegmentationTableContext };
