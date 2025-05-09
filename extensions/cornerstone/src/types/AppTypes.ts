/* eslint-disable @typescript-eslint/no-namespace */
import CornerstoneCacheServiceType from '../services/CornerstoneCacheService';
import CornerstoneViewportServiceType from '../services/ViewportService/CornerstoneViewportService';
import SegmentationServiceType from '../services/SegmentationService';
import SyncGroupServiceType from '../services/SyncGroupService';
import ToolGroupServiceType from '../services/ToolGroupService';
import ColorbarServiceType from '../services/ColorbarService';
import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';

import type {
  SegmentRepresentation as SegmentRep,
  SegmentationData as SegData,
  SegmentationRepresentation as SegRep,
  SegmentationInfo as SegInfo,
} from '../services/SegmentationService/SegmentationService';
import type { ViewportOptions as ViewportOpts } from '../services/ViewportService/Viewport';
declare global {
  namespace AppTypes {
    export type CornerstoneCacheService = CornerstoneCacheServiceType;
    export type CornerstoneViewportService = CornerstoneViewportServiceType;
    export type SegmentationService = SegmentationServiceType;
    export type SyncGroupService = SyncGroupServiceType;
    export type ToolGroupService = ToolGroupServiceType;
    export type ColorbarService = ColorbarServiceType;

    export interface Services {
      cornerstoneViewportService?: CornerstoneViewportServiceType;
      toolGroupService?: ToolGroupServiceType;
      syncGroupService?: SyncGroupServiceType;
      segmentationService?: SegmentationServiceType;
      cornerstoneCacheService?: CornerstoneCacheServiceType;
      colorbarService?: ColorbarServiceType;
    }

    export namespace Segmentation {
      export type SegmentRepresentation = SegmentRep;
      export type SegmentationData = SegData;
      export type SegmentationRepresentation = SegRep;
      export type SegmentationInfo = SegInfo;
    }

    export interface PresentationIds {
      lutPresentationId: string;
      positionPresentationId: string;
      segmentationPresentationId: string;
    }

    export interface Test {
      services?: Services;
      cornerstone?: typeof cornerstone;
      cornerstoneTools?: typeof cornerstoneTools;
    }

    export type ViewportOptions = ViewportOpts;
  }
}
