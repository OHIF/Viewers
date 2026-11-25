import { StackViewportData, VolumeViewportData } from '../../../types/CornerstoneCacheService';

export type ViewportData = StackViewportData | VolumeViewportData;

export type ImageSliceData = {
  imageIndex: number;
  numberOfSlices: number;
};

export type ViewportSliceProgressScrollbarProps = {
  viewportData: ViewportData | null;
  viewportId: string;
  element: HTMLElement;
  imageSliceData: ImageSliceData;
  setImageSliceData: (data: ImageSliceData) => void;
  servicesManager: AppTypes.ServicesManager;
};
