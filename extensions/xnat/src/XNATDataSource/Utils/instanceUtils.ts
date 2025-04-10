import { generateRandomUID } from "./UIDUtils";
import { getSOPClassUIDForModality } from "./SOPUtils";
export function ensureInstanceRequiredFields(instance: any, series: any): any {
  // Ensure UIDs are set
  instance.StudyInstanceUID = instance.StudyInstanceUID || series.StudyInstanceUID;
  instance.SeriesInstanceUID = instance.SeriesInstanceUID || series.SeriesInstanceUID;
  
  // Ensure SOPInstanceUID is always defined
  if (!instance.SOPInstanceUID) {
    // First check if it's in the metadata
    if (instance.metadata && instance.metadata.SOPInstanceUID) {
      instance.SOPInstanceUID = instance.metadata.SOPInstanceUID;
    } else {
      // Only generate as a last resort
      instance.SOPInstanceUID = generateRandomUID();
      console.log('XNAT: Generated new SOPInstanceUID:', instance.SOPInstanceUID);
    }
  }
  
  // Ensure SOPClassUID is set
  if (!instance.SOPClassUID) {
    // Check metadata first
    if (instance.metadata && instance.metadata.SOPClassUID) {
      instance.SOPClassUID = instance.metadata.SOPClassUID;
      console.log('XNAT: Using SOPClassUID from metadata:', instance.SOPClassUID);
    } else {
      // Use the utility function to get appropriate SOPClassUID
      instance.SOPClassUID = getSOPClassUIDForModality(series.Modality || 'CT');
      console.log('XNAT: Using modality-based SOPClassUID:', instance.SOPClassUID);
    }
  }
  
  // Ensure all fields are also in metadata
  if (instance.metadata) {
    instance.metadata.StudyInstanceUID = instance.metadata.StudyInstanceUID || instance.StudyInstanceUID;
    instance.metadata.SeriesInstanceUID = instance.metadata.SeriesInstanceUID || instance.SeriesInstanceUID;
    
    // If instance has SOPInstanceUID but metadata doesn't, copy it to metadata
    if (instance.SOPInstanceUID && !instance.metadata.SOPInstanceUID) {
      instance.metadata.SOPInstanceUID = instance.SOPInstanceUID;
    }
    
    // If instance has SOPClassUID but metadata doesn't, copy it to metadata
    if (instance.SOPClassUID && !instance.metadata.SOPClassUID) {
      instance.metadata.SOPClassUID = instance.SOPClassUID;
    }
  }
  
  return instance;
}
