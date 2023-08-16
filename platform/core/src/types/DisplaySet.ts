import { InstanceMetadata } from './StudyMetadata';

export type DisplaySet = {
  displaySetInstanceUID: string;
  instances: InstanceMetadata[];
  StudyInstanceUID: string;
  SeriesInstanceUID?: string;
  numImages?: number;
  unsupported?: boolean;
};

export type DisplaySetSeriesMetadataInvalidatedEvent = {
  displaySetInstanceUID: string;
  invalidateData: boolean;
};
