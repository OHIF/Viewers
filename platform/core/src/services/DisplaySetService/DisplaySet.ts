import {
  ImageMetadata,
  InstanceMetadata,
} from '../DicomMetadataStore/StudyMetadata';

interface DisplaySet {
  displaySetInstanceUID: string;
  StudyInstanceUID: string;
  SeriesInstanceUID?: string;
  SeriesNumber: string | number;
  images?: ImageMetadata[];
  others?: InstanceMetadata[];
  numImageFrames?: number;
}

export default DisplaySet;
