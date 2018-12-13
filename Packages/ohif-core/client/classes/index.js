import MetadataProvider from './MetadataProvider.js';
import CommandsManager from './CommandsManager.js';
import HotkeysContext from './HotkeysContext.js';
import HotkeysManager from './HotkeysManager.js';
import { ImageSet } from './ImageSet';
import { StudyPrefetcher } from './StudyPrefetcher';
import { ResizeViewportManager } from './ResizeViewportManager';
import { StudyLoadingListener } from './StudyLoadingListener';
import { StackLoadingListener } from './StudyLoadingListener';
import { DICOMFileLoadingListener } from './StudyLoadingListener';
import { StudyMetadata } from './metadata/StudyMetadata';
import { SeriesMetadata } from './metadata/SeriesMetadata';
import { InstanceMetadata } from './metadata/InstanceMetadata';
//import { StudySummary } from './metadata/StudySummary';
import { plugins } from './plugins/';
import { TypeSafeCollection } from './TypeSafeCollection';
import { OHIFError } from './OHIFError.js';
//import { StackImagePositionOffsetSynchronizer } from './StackImagePositionOffsetSynchronizer';
import { StudyMetadataSource } from './StudyMetadataSource';

export {
    MetadataProvider,
    CommandsManager,
    HotkeysContext,
    HotkeysManager,
    ImageSet,
    StudyPrefetcher,
    ResizeViewportManager,
    StudyLoadingListener,
    StackLoadingListener,
    DICOMFileLoadingListener,
    StudyMetadata,
    SeriesMetadata,
    InstanceMetadata,
    //StudySummary,
    TypeSafeCollection,
    OHIFError,
    //StackImagePositionOffsetSynchronizer,
    StudyMetadataSource
};

const classes = {
    MetadataProvider,
    CommandsManager,
    HotkeysContext,
    HotkeysManager,
    ImageSet,
    StudyPrefetcher,
    ResizeViewportManager,
    StudyLoadingListener,
    StackLoadingListener,
    DICOMFileLoadingListener,
    StudyMetadata,
    SeriesMetadata,
    InstanceMetadata,
    //StudySummary,
    TypeSafeCollection,
    OHIFError,
    //StackImagePositionOffsetSynchronizer,
    StudyMetadataSource
};

export default classes;

//Viewerbase.metadata = { StudyMetadata, SeriesMetadata, InstanceMetadata, StudySummary };
//Viewerbase.plugins = plugins;

// TypeSafeCollection
//Viewerbase.TypeSafeCollection = TypeSafeCollection;
