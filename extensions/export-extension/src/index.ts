console.log('🔥 EXPORT EXTENSION: Loading...');

const EXTENSION_ID = '@ohif/extension-export';

// Load JSZip dynamically since it might not be bundled
async function loadJSZip() {
  if (typeof window.JSZip !== 'undefined') {
    return window.JSZip;
  }

  console.log('📦 Loading JSZip...');
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => {
      console.log('✅ JSZip loaded successfully');
      resolve(window.JSZip);
    };
    script.onerror = () => {
      console.error('❌ Failed to load JSZip');
      reject(new Error('Failed to load JSZip'));
    };
    document.head.appendChild(script);
  });
}

// Simple notification function
function showNotification(message, type = 'info') {
  console.log(`📢 ${type.toUpperCase()}: ${message}`);

  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    padding: 12px 16px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
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

// Extract basic metadata
function extractMetadata(displaySet) {
  const now = new Date();
  const metadata = {
    PatientName: 'Unknown Patient',
    StudyDate: now.toISOString().split('T')[0],
    ExportDate: now.toISOString(),
    ExportTime: now.toLocaleTimeString(),
    Source: 'OHIF Viewer Export Extension',
    Timestamp: now.getTime()
  };

  try {
    if (displaySet && displaySet.instances && displaySet.instances.length > 0) {
      const instance = displaySet.instances[0];

      if (instance.PatientName) {
        if (typeof instance.PatientName === 'object') {
          metadata.PatientName = instance.PatientName.Alphabetic || instance.PatientName.toString();
        } else {
          metadata.PatientName = instance.PatientName;
        }
      }

      if (instance.StudyDate) metadata.StudyDate = instance.StudyDate;
      if (instance.StudyInstanceUID) metadata.StudyInstanceUID = instance.StudyInstanceUID;
      if (instance.SeriesInstanceUID) metadata.SeriesInstanceUID = instance.SeriesInstanceUID;
      if (instance.Modality) metadata.Modality = instance.Modality;
      if (instance.SeriesDescription) metadata.SeriesDescription = instance.SeriesDescription;
    }
  } catch (error) {
    console.warn('Error extracting metadata:', error);
  }

  return metadata;
}

// Create and download ZIP file
async function createAndDownloadZip(imageBlob, metadata) {
  console.log('📦 Creating ZIP file...');

  try {
    const JSZip = await loadJSZip();
    const zip = new JSZip();

    // Add image file
    zip.file('image.jpg', imageBlob);

    // Add metadata file
    const metadataJson = JSON.stringify(metadata, null, 2);
    zip.file('metadata.json', metadataJson);

    console.log('📋 Files added to ZIP: image.jpg, metadata.json');

    // Generate ZIP
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    console.log('📦 ZIP generated, size:', zipBlob.size, 'bytes');

    // Download ZIP
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ohif-export-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('✅ ZIP file downloaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error creating ZIP:', error);
    throw error;
  }
}

function getCommandsModule({ servicesManager }) {
  const { viewportGridService, cornerstoneViewportService, displaySetService } = servicesManager.services;

  return {
    definitions: {
      exportViewportAsZip: {
        commandFn: async () => {
          console.log('🚀 Export command started');

          try {
            showNotification('Starting export...', 'info');

            // Get active viewport
            const viewportGridState = viewportGridService.getState();
            const { activeViewportId, viewports } = viewportGridState;

            if (!activeViewportId) {
              throw new Error('No active viewport found');
            }

            console.log('Active viewport ID:', activeViewportId);

            // Get viewport info
            const viewportInfo = viewports.get(activeViewportId);
            if (!viewportInfo) {
              throw new Error('Could not get viewport information');
            }

            console.log('Viewport info:', viewportInfo);

            // Get display set UIDs
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

            // Get display set and extract metadata
            const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
            const metadata = extractMetadata(displaySet);
            console.log('📋 Extracted metadata:', metadata);

            // Get viewport canvas
            const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
            if (!viewport) {
              throw new Error('Could not get cornerstone viewport');
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
                  showNotification('Export successful!', 'success');
                  resolve();
                } catch (error) {
                  console.error('ZIP creation failed:', error);
                  showNotification('Failed to create ZIP: ' + error.message, 'error');
                  reject(error);
                }
              }, 'image/jpeg', 0.9);
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

function getToolbarModule() {
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

console.log('🔥 EXPORT EXTENSION: Loaded successfully');

export default extension;
