import { ReactNode } from 'react';
import { ViewportActionCornersLocations } from '../components/Viewport/ViewportActionCorners';

export interface ViewportActionCornersComponentInfo {
  id: string;
  component: ReactNode;
}

export interface ViewportActionCornersProps {
  cornerComponents: Record<ViewportActionCornersLocations, ViewportActionCornersComponentInfo[]>;
  visibleItemsPerCorner?: number;
  isActiveViewport: boolean;
}
