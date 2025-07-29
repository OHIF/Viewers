import JSZip from 'jszip';

const CONTEXT = 'CORNERSTONE'; // Changed from 'EXPORT' to 'CORNERSTONE'

/**
 * Commands module for export functionality
 */
export function getCommandsModule({ servicesManager }) {
  const { viewportGridService, cornerstoneViewportService, displaySetService } = servicesManager.services;

  const actions = {
    /**
     * Export the active viewport as a ZIP file containing image and metadata
     */
    exportViewportAsZip: () => {
      console.log('🚀 Starting viewport export...');

      try {
        // Get the active viewport
        const { activeViewportId } = viewportGridService.getState();
        if (!activeViewportId) {
          console.error('No active viewport found');
          alert('No active viewport found. Please select a viewport first.');
          return;
        }

        // Get viewport info
        const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
        if (!viewport) {
          console.error('Could not get viewport');
          alert('Could not access viewport. Please try again.');
          return;
        }

        // Get the display set for metadata
        const displaySetInstanceUIDs = viewportGridService.getDisplaySetsInstanceUIdsForViewport(activeViewportId);
        const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUIDs[0]);

        // Extract metadata
        const metadata = extractMetadata(displaySet);
        console.log('📋 Extracted metadata:', metadata);

        // Get the canvas and convert to image
        const canvas = viewport.getCanvas();
        if (!canvas) {
          console.error('Could not get canvas from viewport');
          alert('Could not capture image from viewport.');
          return;
        }

        // Convert canvas to blob
        canvas.toBlob(async (blob) => {
          if (!blob) {
            console.error('Could not convert canvas to blob');
            alert('Could not capture image data.');
            return;
          }

          try {
            await createAndDownloadZip(blob, metadata);
            console.log('✅ Export completed successfully');
          } catch (error) {
            console.error('Error creating ZIP:', error);
            alert('Error creating ZIP file: ' + error.message);
          }
        }, 'image/jpeg', 0.8);

      } catch (error) {
        console.error('Error in exportViewportAsZip:', error);
        alert('Export failed: ' + error.message);
      }
    }
  };

  const definitions = {
    exportViewportAsZip: {
      commandFn: actions.exportViewportAsZip,
      storeContexts: [],
      options: {},
      context: CONTEXT, // Now uses CORNERSTONE context
    },
  };

  return {
    actions,
    definitions,
    defaultContext: CONTEXT, // Now uses CORNERSTONE context
  };
}

/**
 * Extract relevant metadata from display set
 */
function extractMetadata(displaySet) {
  const metadata = {
    PatientName: 'Unknown',
    StudyDate: 'Unknown',
    StudyInstanceUID: 'Unknown',
    SeriesInstanceUID: 'Unknown',
    ExportDate: new Date().toISOString(),
  };

  if (displaySet && displaySet.instances && displaySet.instances.length > 0) {
    const instance = displaySet.instances[0];

    // Extract DICOM metadata
    metadata.PatientName = instance.PatientName?.Alphabetic || 'Unknown';
    metadata.StudyDate = instance.StudyDate || 'Unknown';
    metadata.StudyInstanceUID = instance.StudyInstanceUID || 'Unknown';
    metadata.SeriesInstanceUID = instance.SeriesInstanceUID || 'Unknown';
    metadata.Modality = instance.Modality || 'Unknown';
    metadata.SeriesDescription = instance.SeriesDescription || 'Unknown';
  }

  return metadata;
}

/**
 * Create ZIP file with image and metadata, then trigger download
 */
async function createAndDownloadZip(imageBlob, metadata) {
  console.log('📦 Creating ZIP file...');

  const zip = new JSZip();

  // Add image to ZIP
  zip.file('image.jpg', imageBlob);

  // Add metadata as JSON
  const metadataJson = JSON.stringify(metadata, null, 2);
  zip.file('metadata.json', metadataJson);

  // Generate ZIP file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 6
    }
  });

  // Create download link and trigger download
  const url = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ohif-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('📥 Download triggered');
}
