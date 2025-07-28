console.log('🔥 EXPORT MODE: Loading...');

const id = '@ohif/mode-export';

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-export': '^1.0.0', // Our custom extension
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

              // Get services we need
              const { cornerstoneViewportService, displaySetService } = servicesManager.services;

              try {
                // Get active viewport
                const activeViewportId = cornerstoneViewportService.getActiveViewportId();
                const viewport = cornerstoneViewportService.getCornerstoneViewport(activeViewportId);

                if (!viewport) {
                  alert('No active viewport found!');
                  return;
                }

                // Get the canvas element and convert to image
                const canvas = viewport.getCanvas();
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

                // Convert data URL to blob
                const base64Data = imageDataUrl.split(',')[1];
                const imageBlob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], {
                  type: 'image/jpeg'
                });

                // Get display set for metadata
                const viewportInfo = cornerstoneViewportService.getViewportInfo(activeViewportId);
                const displaySetUIDs = viewportInfo.getDisplaySetUIDs();

                let metadata = {
                  PatientName: 'Unknown',
                  StudyDate: 'Unknown',
                  exportDate: new Date().toISOString()
                };

                if (displaySetUIDs && displaySetUIDs.length > 0) {
                  const displaySet = displaySetService.getDisplaySetByUID(displaySetUIDs[0]);
                  if (displaySet && displaySet.instances && displaySet.instances.length > 0) {
                    const firstInstance = displaySet.instances[0];
                    metadata.PatientName = firstInstance.PatientName || 'Unknown';
                    metadata.StudyDate = firstInstance.StudyDate || 'Unknown';
                    metadata.StudyInstanceUID = firstInstance.StudyInstanceUID || 'Unknown';
                    metadata.SeriesInstanceUID = firstInstance.SeriesInstanceUID || 'Unknown';
                  }
                }

                // Create ZIP file using JSZip (assuming it's loaded globally)
                if (typeof JSZip !== 'undefined') {
                  const zip = new JSZip();

                  // Add image to zip
                  zip.file('image.jpg', imageBlob);

                  // Add metadata to zip
                  zip.file('metadata.json', JSON.stringify(metadata, null, 2));

                  // Generate and download zip
                  zip.generateAsync({ type: 'blob' }).then(function(content) {
                    // Create download link
                    const url = URL.createObjectURL(content);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'report.zip';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);

                    console.log('✅ Export completed successfully!');
                  });
                } else {
                  alert('JSZip library not loaded. Please include JSZip in your HTML.');
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

      // Update toolbar to include export button from our extension
      toolbarService.updateSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'ExportZip', // Our export button from the extension
        'Layout',
        'MoreTools',
      ]);

      console.log('🔧 EXPORT MODE: Toolbar configured with export button');
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
      // Accept all modalities except Slide Microscopy
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
