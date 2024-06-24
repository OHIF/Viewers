
let DicomMicroscopyViewer;

/**
 * Imports the DicomMicroscopyViewer as an external.  This is the same function
 * as in WSIViewport, but is repeated here because of stupid webpack bugs that
 * prevent using dynamic imports in nested/included modules.
 */
export async function getDicomMicroscopyViewer() {
  if (DicomMicroscopyViewer) {
    return DicomMicroscopyViewer;
  }
  // Import the straight module so that webpack doesn't touch it.
  await import(/* webpackIgnore: true */ this.getImportPath());
  DicomMicroscopyViewer = (window as any).dicomMicroscopyViewer;
  return DicomMicroscopyViewer;
}

/** Export the name separately to really prevent this from being dynamic */
export function getDicomMicroscopyViewerImportPath() {
  return '/dicom-microscopy-viewer/dicomMicroscopyViewer.min.js';
}
