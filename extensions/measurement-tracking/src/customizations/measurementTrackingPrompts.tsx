import promptBeginTracking from '../contexts/TrackedMeasurementsContext/promptBeginTracking';
import promptHasDirtyAnnotations from '../contexts/TrackedMeasurementsContext/promptHasDirtyAnnotations';
import promptHydrateStructuredReport from '../contexts/TrackedMeasurementsContext/promptHydrateStructuredReport';
import promptTrackNewSeries from '../contexts/TrackedMeasurementsContext/promptTrackNewSeries';
import promptTrackNewStudy from '../contexts/TrackedMeasurementsContext/promptTrackNewStudy';
import { promptLabelAnnotation, promptSaveReport } from '@ohif/extension-default';

export default {
  'measurement.promptBeginTracking': promptBeginTracking,
  'measurement.promptHydrateStructuredReport': promptHydrateStructuredReport,
  'measurement.promptTrackNewSeries': promptTrackNewSeries,
  'measurement.promptTrackNewStudy': promptTrackNewStudy,
  'measurement.promptLabelAnnotation': promptLabelAnnotation,
  'measurement.promptSaveReport': promptSaveReport,
  'measurement.promptHasDirtyAnnotations': promptHasDirtyAnnotations,
};
