import {
  InstanceMetadata,
  SeriesMetadata,
  StudyMetadata,
  StudySummary,
} from './metadata';

import CommandsManager from './CommandsManager.js';
import { DICOMFileLoadingListener } from './StudyLoadingListener';
import HotkeysManager from './HotkeysManager.js';
import ImageSet from './ImageSet';
import MetadataProvider from './MetadataProvider.js';
import OHIFError from './OHIFError.js';
import { OHIFStudyMetadataSource } from './OHIFStudyMetadataSource';
import { StackLoadingListener } from './StudyLoadingListener';
import { StudyLoadingListener } from './StudyLoadingListener';
import { StudyMetadataSource } from './StudyMetadataSource';
import { StudyPrefetcher } from './StudyPrefetcher';
import { TypeSafeCollection } from './TypeSafeCollection';

export {
  OHIFStudyMetadataSource,
  MetadataProvider,
  CommandsManager,
  HotkeysManager,
  ImageSet,
  StudyPrefetcher,
  StudyLoadingListener,
  StackLoadingListener,
  DICOMFileLoadingListener,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  StudySummary,
  TypeSafeCollection,
  OHIFError,
  StudyMetadataSource,
};

const classes = {
  OHIFStudyMetadataSource,
  MetadataProvider,
  CommandsManager,
  HotkeysManager,
  ImageSet,
  StudyPrefetcher,
  StudyLoadingListener,
  StackLoadingListener,
  DICOMFileLoadingListener,
  StudyMetadata,
  SeriesMetadata,
  InstanceMetadata,
  StudySummary,
  TypeSafeCollection,
  OHIFError,
  StudyMetadataSource,
};

export default classes;
