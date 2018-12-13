import { StudyMetadata } from './StudyMetadata';
import { SeriesMetadata } from './SeriesMetadata';
import { InstanceMetadata } from './InstanceMetadata';
import { OHIFStudyMetadata } from './OHIFStudyMetadata';
import { OHIFSeriesMetadata } from './OHIFSeriesMetadata';
import { OHIFInstanceMetadata } from './OHIFInstanceMetadata';
import { Metadata } from './Metadata';
import { WadoRsMetaDataBuilder } from './WadoRsMetaDataBuilder';

const metadata = {
    Metadata,
    WadoRsMetaDataBuilder,
    StudyMetadata,
    SeriesMetadata,
    InstanceMetadata,
    OHIFStudyMetadata,
    OHIFSeriesMetadata,
    OHIFInstanceMetadata
}

export default metadata;
