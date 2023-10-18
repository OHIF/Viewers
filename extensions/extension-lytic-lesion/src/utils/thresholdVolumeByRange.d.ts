import { Types } from '@cornerstonejs/core';
import { BoundsIJK } from '../../types';
import { ThresholdInformation } from './utilities';
export declare type ThresholdRangeOptions = {
    overwrite: boolean;
    boundsIJK: BoundsIJK;
    overlapType?: number;
};
declare function thresholdVolumeByRange(segmentationVolume: Types.IImageVolume, thresholdVolumeInformation: ThresholdInformation[], segmentIndex: number, options: ThresholdRangeOptions): Types.IImageVolume;
export default thresholdVolumeByRange;
