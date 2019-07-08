import { InstanceMetadata } from './InstanceMetadata';
import { Metadata } from './Metadata';
import { OHIFInstanceMetadata } from './OHIFInstanceMetadata';
import { OHIFSeriesMetadata } from './OHIFSeriesMetadata';
import { OHIFStudyMetadata } from './OHIFStudyMetadata';
import { SeriesMetadata } from './SeriesMetadata';
import { StudyMetadata } from './StudyMetadata';
import { StudySummary } from './StudySummary';
import { WadoRsMetaDataBuilder } from './WadoRsMetaDataBuilder';

const metadata = {
  Metadata,
  StudySummary,
  WadoRsMetaDataBuilder,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  OHIFStudyMetadata,
  OHIFSeriesMetadata,
  OHIFInstanceMetadata,
};

export {
  Metadata,
  StudySummary,
  WadoRsMetaDataBuilder,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  OHIFStudyMetadata,
  OHIFSeriesMetadata,
  OHIFInstanceMetadata,
};

export default metadata;
