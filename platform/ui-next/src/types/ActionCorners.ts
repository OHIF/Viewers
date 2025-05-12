import { ReactNode } from 'react';
import { ViewportActionCornersLocations } from '../components/Viewport/ViewportActionCorners';

export type ActionComponentInfo = {
  viewportId: string;
  id: string;
  component: ReactNode;
  location: ViewportActionCornersLocations;
  indexPriority?: number;
  isLocked?: boolean;
  isOpen?: boolean;
  isVisible?: boolean;
};

export type AlignAndSide = {
  align: 'start' | 'end' | 'center';
  side: 'top' | 'bottom' | 'left' | 'right';
};
