import { ReactNode } from 'react';

export enum ViewportActionCornersLocations {
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
}

export interface ViewportActionCornersComponentInfo {
  id: string;
  component: ReactNode;
}

export type ViewportActionCornersProps = {
  cornerComponents: Record<
    ViewportActionCornersLocations,
    Array<ViewportActionCornersComponentInfo>
  >;
};
