const id = '@ohif/mode-export';

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-export': '^1.0.0',
};

function modeFactory({ modeConfiguration }) {

  return {
    id,
    routeName: 'export',
    displayName: 'Export Mode',

    onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {

      const { toolbarService, toolGroupService } = servicesManager.services;

      // Get tools from cornerstone extension
      const utilityModule = extensionManager.getModuleEntry(
        '@ohif/extension-cornerstone.utilityModule.tools'
      );

      const { toolNames, Enums } = utilityModule.exports;

      // Configure basic tools
      const tools = {
        active: [
          {
            toolName: toolNames.WindowLevel,
            bindings: [{ mouseButton: Enums.MouseBindings.Primary }],
          },
          {
            toolName: toolNames.Pan,
            bindings: [{ mouseButton: Enums.MouseBindings.Auxiliary }],
          },
          {
            toolName: toolNames.Zoom,
            bindings: [{ mouseButton: Enums.MouseBindings.Secondary }, { numTouchPoints: 2 }],
          },
          {
            toolName: toolNames.StackScroll,
            bindings: [{ mouseButton: Enums.MouseBindings.Wheel }],
          },
        ],
        passive: [
          { toolName: toolNames.Length },
          { toolName: toolNames.Bidirectional },
          { toolName: toolNames.Probe },
          { toolName: toolNames.EllipticalROI },
          { toolName: toolNames.CircleROI },
          { toolName: toolNames.RectangleROI },
        ],
        enabled: [{ toolName: toolNames.ImageOverlayViewer }],
      };

      // Create tool group
      toolGroupService.createToolGroupAndAddTools('export', tools);

      // Force register export command directly since extension isn't working
      try {
        const { viewportGridService, cornerstoneViewportService, displaySetService } = servicesManager.services;

        commandsManager.registerCommand('CORNERSTONE', 'exportViewportAsZip', {
          commandFn: () => {

            try {
              // Get the active viewport using the correct API
              const viewportGridState = viewportGridService.getState();
              const { activeViewportId, viewports } = viewportGridState;

              if (!activeViewportId) {
                console.error('No active viewport found');
                showNotification('No active viewport found. Please select a viewport first.', 'error');
                return;
              }

              console.log('Active viewport ID:', activeViewportId);

              // Get viewport info using the correct approach
              const viewportInfo = viewports.get(activeViewportId);
              if (!viewportInfo) {
                console.error('No viewport info found');
                showNotification('Could not get viewport information.', 'error');
                return;
              }

              console.log('Viewport info:', viewportInfo);

              // Get display set UIDs from the viewport info
              let displaySetUIDs = [];

              if (viewportInfo.displaySetInstanceUIDs) {
                displaySetUIDs = viewportInfo.displaySetInstanceUIDs;
              } else if (viewportInfo.displaySetOptions) {
                // Alternative way to get display sets
                displaySetUIDs = viewportInfo.displaySetOptions.map(option => option.displaySetInstanceUID);
              }

              if (!displaySetUIDs || displaySetUIDs.length === 0) {
                console.error('No display sets found for viewport');
                showNotification('No image data found in viewport.', 'error');
                return;
              }

              console.log('Display Set UIDs:', displaySetUIDs);

              // Get the first display set
              const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
              if (!displaySet) {
                console.error('Could not get display set');
                showNotification('Could not access image data.', 'error');
                return;
              }

              console.log('Display set:', displaySet);

              // Extract metadata
              const metadata = extractMetadata(displaySet);
              console.log('Extracted metadata:', metadata);

              // Get the viewport and canvas
              const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);
              if (!viewport) {
                console.error('Could not get viewport');
                showNotification('Could not access viewport. Please try again.', 'error');
                return;
              }

              const canvas = viewport.getCanvas();
              if (!canvas) {
                console.error('Could not get canvas from viewport');
                showNotification('Could not capture image from viewport.', 'error');
                return;
              }

              console.log('Canvas found:', canvas.width, 'x', canvas.height);

              // Convert canvas to blob
              canvas.toBlob(async (blob) => {
                if (!blob) {
                  console.error('Could not convert canvas to blob');
                  showNotification('Could not capture image data.', 'error');
                  return;
                }

                try {
                  await createAndDownloadZip(blob, metadata);
                  console.log('Export completed successfully');
                  showNotification('ZIP file exported successfully!', 'success');
                } catch (error) {
                  console.error('Error creating ZIP:', error);
                  showNotification('Error creating ZIP file: ' + error.message, 'error');
                }
              }, 'image/jpeg', 0.8);

            } catch (error) {
              console.error('Error in exportViewportAsZip:', error);
              showNotification('Export failed: ' + error.message, 'error');
            }
          },
        });
        console.log('EXPORT MODE: Export command registered directly in mode');
      } catch (error) {
        console.error('EXPORT MODE: Error registering export command:', error);
      }

      // Add integrated toolbar export button
      setTimeout(() => {
        addIntegratedToolbarButton(commandsManager);
      }, 1000);

      // Update the toolbar to include our button using the standard approach
      try {
        toolbarService.updateSection('primary', [
          'MeasurementTools',
          'Zoom',
          'WindowLevel',
          'Pan',
          'ExportZip',
          'Layout',
          'MoreTools',
        ]);
        console.log('EXPORT MODE: Toolbar updated with export button from extension');
      } catch (error) {
        console.error('EXPORT MODE: Error updating toolbar section:', error);
      }

      // Make the export function available globally
      window.exportCurrentViewport = () => {
        try {
          commandsManager.runCommand('exportViewportAsZip', {}, 'CORNERSTONE');
        } catch (error) {
          console.error('Failed to run export command:', error);
          // Try without context as fallback
          try {
            commandsManager.runCommand('exportViewportAsZip');
          } catch (fallbackError) {
            console.error('Fallback command also failed:', fallbackError);
          }
        }
      };

      console.log('EXPORT MODE: Mode setup completed');
    },

    onModeExit: ({ servicesManager }) => {
      console.log('👋 EXPORT MODE: Exiting...');
      const { toolGroupService, uiDialogService, uiModalService } = servicesManager.services;

      try {
        uiDialogService.hideAll();
        uiModalService.hide();
        toolGroupService.destroy();

        // Clean up any custom elements
        const integratedButton = document.getElementById('integrated-export-btn');
        if (integratedButton) {
          integratedButton.remove();
        }
      } catch (error) {
        console.warn('Warning during mode exit cleanup:', error);
      }
    },

    validationTags: {
      study: [],
      series: [],
    },

    isValidMode: ({ modalities }) => {
      const modalitiesList = modalities.split('\\');
      return {
        valid: !modalitiesList.includes('SM'),
        description: 'Export mode supports all modalities except SM',
      };
    },

    routes: [
      {
        path: 'viewer',
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
            props: {
              leftPanels: ['@ohif/extension-default.panelModule.seriesList'],
              leftPanelResizable: true,
              rightPanels: ['@ohif/extension-default.panelModule.seriesList'],
              rightPanelResizable: true,
              headerComponent: '@ohif/extension-default.layoutTemplateModule.toolbar',
              viewports: [
                {
                  namespace: '@ohif/extension-cornerstone.viewportModule.cornerstone',
                  displaySetsToDisplay: ['@ohif/extension-default.sopClassHandlerModule.stack'],
                },
              ],
            },
          };
        },
      },
    ],

    extensions: extensionDependencies,
    hangingProtocol: 'default',
    sopClassHandlers: ['@ohif/extension-default.sopClassHandlerModule.stack'],
  };
}

// Integrated toolbar button function
function addIntegratedToolbarButton(commandsManager) {

  // Remove any existing buttons
  const existingIntegrated = document.getElementById('integrated-export-btn');
  if (existingIntegrated) {
    existingIntegrated.remove();
  }

  // Function to find and add button to toolbar
  function addToToolbar() {
    // Find OHIF's main toolbar
    const toolbar = document.querySelector('[data-cy="toolbar"]') ||
                   document.querySelector('.toolbar') ||
                   document.querySelector('nav') ||
                   document.querySelector('[class*="toolbar"]') ||
                   document.querySelector('[class*="nav"]');

    if (!toolbar) {
      // Try to find header or any container at the top
      const header = document.querySelector('header') ||
                    document.querySelector('[class*="header"]') ||
                    document.querySelector('[class*="top"]') ||
                    document.querySelector('[role="banner"]');

      if (header) {
        addButtonToContainer(header, 'header');
        return true;
      }
      return false;
    }

    addButtonToContainer(toolbar, 'toolbar');
    return true;
  }

  function addButtonToContainer(container, containerType) {
    console.log(`Found ${containerType}, adding export button...`);

    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'integrated-export-btn';
    buttonContainer.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin: 0 8px;
      ${containerType === 'header' ? 'margin-left: auto;' : ''}
    `;

    // Create the export button
    const button = document.createElement('button');
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
        <path d="M12,12L16,16H13V19H11V16H8L12,12Z"/>
      </svg>
      Export ZIP
    `;

    // Style the button to match OHIF's design
    button.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 8px 12px;
      background: transparent;
      color: #ffffff;
      border: 1px solid #4a5568;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s ease;
      font-family: inherit;
      height: 36px;
      white-space: nowrap;
    `;

    // Add hover effects that match OHIF style
    button.onmouseover = () => {
      button.style.background = '#4a5568';
      button.style.borderColor = '#718096';
    };

    button.onmouseout = () => {
      button.style.background = 'transparent';
      button.style.borderColor = '#4a5568';
    };

    // Add click effect
    button.onmousedown = () => {
      button.style.background = '#2d3748';
    };

    button.onmouseup = () => {
      button.style.background = '#4a5568';
    };

    // Export functionality
    button.onclick = async () => {

      try {
        // Show loading state
        const originalHTML = button.innerHTML;
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px; animation: spin 1s linear infinite;">
            <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z"/>
          </svg>
          Exporting...
        `;
        button.disabled = true;

        // Add spinning animation
        if (!document.getElementById('spin-animation')) {
          const style = document.createElement('style');
          style.id = 'spin-animation';
          style.textContent = `
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }

        // Use the registered command
        try {
          commandsManager.runCommand('exportViewportAsZip', {}, 'CORNERSTONE');
        } catch (commandError) {
          // Fallback to direct export if command fails
          console.warn('Command failed, using direct export:', commandError);
          await directExport();
        }

        // Reset button
        button.innerHTML = originalHTML;
        button.disabled = false;

      } catch (error) {
        console.error('Export error:', error);
        showNotification('Export failed: ' + error.message, 'error');
        button.innerHTML = originalHTML;
        button.disabled = false;
      }
    };

    // Direct export function as fallback
    async function directExport() {
      const canvas = document.querySelector('canvas');

      canvas.toBlob(async (blob) => {
        if (!blob) {
          showNotification('Could not capture image data from viewport.', 'error');
          return;
        }

        try {
          // Create basic metadata
          const metadata = {
            PatientName: 'OHIF Patient',
            StudyDate: new Date().toISOString().split('T')[0],
            ExportDate: new Date().toISOString(),
            ExportTime: new Date().toLocaleTimeString(),
            Source: 'OHIF Viewer Export Mode',
            ImageDimensions: `${canvas.width}x${canvas.height}`,
            Timestamp: Date.now()
          };

          await createAndDownloadZip(blob, metadata);
          showNotification('ZIP file exported successfully!', 'success');

        } catch (error) {
          console.error('Direct export error:', error);
          showNotification('Export failed: ' + error.message, 'error');
        }
      }, 'image/jpeg', 0.9);
    }

    buttonContainer.appendChild(button);
    container.appendChild(buttonContainer);

    console.log(`Export button successfully integrated into ${containerType}!`);
  }

  // Try to add button immediately
  if (!addToToolbar()) {
    const retryInterval = setInterval(() => {
      if (addToToolbar()) {
        clearInterval(retryInterval);
      }
    }, 1000);

    // Stop trying after 30 seconds
    setTimeout(() => {
      clearInterval(retryInterval);
      console.log('Could not find suitable container for export button');
    }, 30000);
  }
}

// Helper functions for the export functionality
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

// Load JSZip dynamically
async function loadJSZip() {
  if (typeof JSZip !== 'undefined') {
    return JSZip;
  }
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

async function createAndDownloadZip(imageBlob, metadata) {
  console.log('📦 Creating ZIP file...');

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

  // Remove notification after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 4000);
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
