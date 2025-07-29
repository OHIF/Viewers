const EXTENSION_ID = '@ohif/extension-export';

// Load JSZip dynamically
async function loadJSZip() {
  if (typeof JSZip !== 'undefined') {
    return JSZip;
  }

  console.log('📦 Loading JSZip library...');
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => {
      console.log('JSZip library loaded');
      resolve(JSZip);
    };
    script.onerror = () => {
      console.error('Failed to load JSZip library');
      reject(new Error('Failed to load JSZip'));
    };
    document.head.appendChild(script);
  });
}

// OHIF-style notification function
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10001;
    padding: 12px 16px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: inherit;
    max-width: 300px;
    word-wrap: break-word;
  `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

// Extract metadata from display set
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

    metadata.PatientName = instance.PatientName?.Alphabetic || 'Unknown';
    metadata.StudyDate = instance.StudyDate || 'Unknown';
    metadata.StudyInstanceUID = instance.StudyInstanceUID || 'Unknown';
    metadata.SeriesInstanceUID = instance.SeriesInstanceUID || 'Unknown';
    metadata.Modality = instance.Modality || 'Unknown';
    metadata.SeriesDescription = instance.SeriesDescription || 'Unknown';
  }

  return metadata;
}

// Create and download ZIP file
async function createAndDownloadZip(imageBlob, metadata) {

  // Make sure JSZip is loaded
  if (typeof JSZip === 'undefined') {
    await loadJSZip();
  }

  if (typeof JSZip === 'undefined') {
    throw new Error('JSZip library could not be loaded');
  }

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
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getCommandsModule({ servicesManager }) {
  const { viewportGridService, cornerstoneViewportService, displaySetService } = servicesManager.services;

  return {
    definitions: {
      exportViewportAsZip: {
        commandFn: async () => {

          try {
            showNotification('Starting export...', 'info');

            // Get the active viewport using the correct API
            const viewportGridState = viewportGridService.getState();
            const { activeViewportId, viewports } = viewportGridState;

            if (!activeViewportId) {
              throw new Error('No active viewport found');
            }

            console.log('Active viewport ID:', activeViewportId);

            // Get viewport info using the correct approach
            const viewportInfo = viewports.get(activeViewportId);
            if (!viewportInfo) {
              throw new Error('Could not get viewport information');
            }

            console.log('Viewport info:', viewportInfo);

            // Get display set UIDs from the viewport info
            let displaySetUIDs = [];

            if (viewportInfo.displaySetInstanceUIDs) {
              displaySetUIDs = viewportInfo.displaySetInstanceUIDs;
            } else if (viewportInfo.displaySetOptions) {
              displaySetUIDs = viewportInfo.displaySetOptions.map(option => option.displaySetInstanceUID);
            }

            if (!displaySetUIDs || displaySetUIDs.length === 0) {
              throw new Error('No display sets found for viewport');
            }

            console.log('Display Set UIDs:', displaySetUIDs);

            // Get the first display set
            const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
            if (!displaySet) {
              throw new Error('Could not get display set');
            }

            console.log('Display set:', displaySet);

            // Extract metadata
            const metadata = extractMetadata(displaySet);
            console.log('Extracted metadata:', metadata);

            // Get the viewport and canvas
            const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
            if (!viewport) {
              throw new Error('Could not get viewport');
            }

            const canvas = viewport.getCanvas();
            if (!canvas) {
              throw new Error('Could not get canvas from viewport');
            }

            console.log('Canvas found:', canvas.width, 'x', canvas.height);

            // Convert canvas to blob and create ZIP
            return new Promise((resolve, reject) => {
              canvas.toBlob(async (blob) => {
                if (!blob) {
                  const error = new Error('Could not convert canvas to blob');
                  console.error(error);
                  showNotification('Could not capture image', 'error');
                  reject(error);
                  return;
                }

                try {
                  await createAndDownloadZip(blob, metadata);
                  console.log('Export completed successfully');
                  showNotification('ZIP file exported successfully!', 'success');
                  resolve();
                } catch (error) {
                  console.error('ZIP creation failed:', error);
                  showNotification('Failed to create ZIP: ' + error.message, 'error');
                  reject(error);
                }
              }, 'image/jpeg', 0.8);
            });

          } catch (error) {
            console.error('Export command failed:', error);
            showNotification('Export failed: ' + error.message, 'error');
            throw error;
          }
        },
        storeContexts: [],
        options: {},
      },
    },
    defaultContext: 'CORNERSTONE',
  };
}

function getToolbarModule({ servicesManager, commandsManager }) {
  console.log('EXPORT EXTENSION: Creating toolbar module');

  return [
    {
      name: 'ExportZip',
      id: 'ExportZip',
      type: 'ohif.radioGroup',
      props: {
        type: 'tool',
        icon: 'icon-save',
        label: 'Export ZIP',
        tooltip: 'Export current viewport as ZIP file',
        commands: [
          {
            commandName: 'exportViewportAsZip',
            commandOptions: {},
            context: 'CORNERSTONE',
          },
        ],
      },
    },
  ];
}

const extension = {
  id: EXTENSION_ID,
  getCommandsModule,
  getToolbarModule,
};

export default extension;
