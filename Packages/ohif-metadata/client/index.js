import { Metadata } from '../namespace';

// OHIFStudyMetadata, OHIFSeriesMetadata, OHIFInstanceMetadata
import { OHIFStudyMetadata } from './OHIFStudyMetadata';
import { OHIFSeriesMetadata } from './OHIFSeriesMetadata';
import { OHIFInstanceMetadata } from './OHIFInstanceMetadata';

Metadata.StudyMetadata = OHIFStudyMetadata;
Metadata.SeriesMetadata = OHIFSeriesMetadata;
Metadata.InstanceMetadata = OHIFInstanceMetadata;