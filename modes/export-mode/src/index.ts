console.log('🔥 EXPORT MODE: Loading...');

const id = '@ohif/mode-export';

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-export': '^1.0.0',
};

function modeFactory({ modeConfiguration }) {
  console.log('🚀 EXPORT MODE: modeFactory called');

  return {
    id,
    routeName: 'export',
    displayName: 'Export Mode',

    onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
      console.log('🎉 EXPORT MODE: Entered successfully!');

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

      // Register export command
      if (commandsManager) {
        try {
          commandsManager.registerCommand('exportViewportAsZip', {
            commandFn: ({ servicesManager }) => {
              console.log('🚀 Export ZIP button clicked!');

              const { cornerstoneViewportService, displaySetService } = servicesManager.services;

              try {
                // Get active viewport
                const activeViewportId = cornerstoneViewportService.getActiveViewportId();
                const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);

                if (!viewport) {
                  alert('No active viewport found!');
                  return;
                }

                // Get the canvas and convert to image
                const canvas = viewport.getCanvas();
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

                // Convert data URL to blob
                const base64Data = imageDataUrl.split(',')[1];
                const imageBlob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], {
                  type: 'image/jpeg'
                });

                // Get metadata from display set (fixed approach)
                let metadata = {
                  PatientName: 'Unknown',
                  StudyDate: 'Unknown',
                  ExportDate: new Date().toISOString()
                };

                try {
                  // Try to get viewport info and display sets
                  const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);
                  if (viewportInfo && viewportInfo.getDisplaySetUIDs) {
                    const displaySetUIDs = viewportInfo.getDisplaySetUIDs();

                    if (displaySetUIDs && displaySetUIDs.length > 0) {
                      const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
                      if (displaySet && displaySet.instances && displaySet.instances.length > 0) {
                        const firstInstance = displaySet.instances[0];
                        metadata.PatientName = firstInstance.PatientName || 'Unknown';
                        metadata.StudyDate = firstInstance.StudyDate || 'Unknown';
                        metadata.StudyInstanceUID = firstInstance.StudyInstanceUID || 'Unknown';
                        metadata.SeriesInstanceUID = firstInstance.SeriesInstanceUID || 'Unknown';
                        metadata.Modality = firstInstance.Modality || 'Unknown';
                      }
                    }
                  }
                } catch (metadataError) {
                  console.warn('Could not extract metadata:', metadataError);
                  // Continue with default metadata
                }

                // Create and download ZIP
                if (typeof JSZip !== 'undefined') {
                  const zip = new JSZip();
                  zip.file('image.jpg', imageBlob);
                  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

                  zip.generateAsync({ type: 'blob' }).then(function(content) {
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'ohif-export-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.zip';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    console.log('✅ Export completed successfully!');
                  });
                } else {
                  alert('JSZip library not loaded. Please include JSZip.');
                }

              } catch (error) {
                console.error('❌ Export failed:', error);
                alert('Export failed: ' + error.message);
              }
            },
          });
          console.log('✅ Export command registered successfully');
        } catch (error) {
          console.error('❌ Failed to register export command:', error);
        }
      }

      // Register the export button directly in the mode with correct OHIF structure
      const exportButton = {
        name: 'ExportZip',
        id: 'ExportZip',
        uiType: 'ohif.toolbarButton',
        props: {
          icon: 'icon-download',
          label: 'Export ZIP',
          tooltip: 'Export current viewport as ZIP file with image and metadata',
          commands: [
            {
              commandName: 'exportViewportAsZip',
            },
          ],
        },
      };

      // Register the button with the toolbar service
      try {
        toolbarService.register([exportButton]);
        console.log('✅ EXPORT MODE: Export button registered directly in mode');
      } catch (error) {
        console.error('❌ EXPORT MODE: Error registering export button:', error);
      }

      // Update toolbar WITHOUT the export button to avoid errors for now
      toolbarService.updateSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        // 'ExportZip', // Commented out to avoid defaultComponent error
        'Layout',
        'MoreTools',
      ]);

      console.log('✅ EXPORT MODE: Toolbar configured (export button available via console command)');

      // Automatically add the export button when entering export mode
      setTimeout(() => {
        window.addExportButton();
      }, 1000); // Wait 1 second for mode to fully load

      // Make export function available globally for easy access
      window.exportCurrentViewport = () => {
        try {
          console.log('🚀 Export ZIP button clicked!');

          // Simple approach: get the canvas directly from the DOM
          const canvas = document.querySelector('canvas');
          if (!canvas) {
            alert('No viewport canvas found!');
            return;
          }

          // Convert canvas to image
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
          const base64Data = imageDataUrl.split(',')[1];
          const imageBlob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], {
            type: 'image/jpeg'
          });

          // Create simple metadata
          const metadata = {
            PatientName: 'OHIF Patient',
            StudyDate: new Date().toISOString().split('T')[0],
            ExportDate: new Date().toISOString(),
            ExportTime: new Date().toLocaleTimeString(),
            Source: 'OHIF Viewer Export Mode'
          };

          // Create and download ZIP
          if (typeof JSZip !== 'undefined') {
            const zip = new JSZip();
            zip.file('image.jpg', imageBlob);
            zip.file('metadata.json', JSON.stringify(metadata, null, 2));

            zip.generateAsync({ type: 'blob' }).then(function(content) {
              const url = URL.createObjectURL(content);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ohif-export-' + new Date().toISOString().slice(0, 19).replace(/:/g, '-') + '.zip';
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              console.log('✅ Export completed successfully!');

              // Show success message
              const successMsg = document.createElement('div');
              successMsg.textContent = '✅ ZIP file downloaded successfully!';
              successMsg.style.cssText = `
                position: fixed;
                top: 120px;
                right: 10px;
                z-index: 10000;
                padding: 12px 16px;
                background: #10b981;
                color: white;
                border-radius: 6px;
                font-size: 14px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              `;
              document.body.appendChild(successMsg);
              setTimeout(() => successMsg.remove(), 3000);
            });
          } else {
            alert('JSZip library not loaded. Please include JSZip.');
          }

        } catch (error) {
          console.error('❌ Export failed:', error);
          alert('Export failed: ' + error.message);
        }
      };

      // Function to add temporary export button
      window.addExportButton = () => {
        // Remove existing button if present
        const existingButton = document.getElementById('temp-export-btn');
        if (existingButton) {
          existingButton.remove();
        }

        const button = document.createElement('button');
        button.id = 'temp-export-btn';
        button.textContent = '📥 Export ZIP';
        button.style.cssText = `
          position: fixed;
          top: 70px;
          right: 10px;
          z-index: 9999;
          padding: 12px 16px;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;
        button.onclick = window.exportCurrentViewport;
        button.onmouseover = () => button.style.background = '#0052a3';
        button.onmouseout = () => button.style.background = '#0066cc';
        document.body.appendChild(button);
        console.log('✅ Export button added to top-right corner');
      };
    },

    onModeExit: ({ servicesManager }) => {
      console.log('👋 EXPORT MODE: Exiting...');
      const { toolGroupService, uiDialogService, uiModalService } = servicesManager.services;
      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
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

console.log('🔥 EXPORT MODE: Loaded successfully');

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
