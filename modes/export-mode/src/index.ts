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

      // Try to add extension button to toolbar first
      try {
        toolbarService.updateSection('primary', [
          'MeasurementTools',
          'Zoom',
          'WindowLevel',
          'Pan',
          'ExportZip', // This comes from your extension
          'Layout',
          'MoreTools',
        ]);
        console.log('EXPORT MODE: Toolbar updated with export button from extension');
      } catch (error) {
        console.error('EXPORT MODE: Error updating toolbar section:', error);
      }

      // Always add the working button since extension toolbar integration isn't working
      setTimeout(() => {
        addExportButton(commandsManager);
      }, 1000);

      // Global test function for debugging
      window.exportCurrentViewport = () => {
        try {
          commandsManager.runCommand('exportViewportAsZip', {}, 'CORNERSTONE');
        } catch (error) {
          console.error('Failed to run export command:', error);
        }
      };

    },

    onModeExit: ({ servicesManager }) => {
      console.log('👋 EXPORT MODE: Exiting...');
      const { toolGroupService, uiDialogService, uiModalService } = servicesManager.services;

      try {
        uiDialogService.hideAll();
        uiModalService.hide();
        toolGroupService.destroy();

        // Clean up global function
        if (window.exportCurrentViewport) {
          delete window.exportCurrentViewport;
        }

        // Clean up export button
        const exportBtn = document.getElementById('export-zip-btn');
        if (exportBtn) {
          exportBtn.remove();
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

// Add the export button that we know works
function addExportButton(commandsManager) {

  // Remove any existing buttons
  const existingBtn = document.getElementById('export-zip-btn');
  if (existingBtn) {
    existingBtn.remove();
  }

  // Function to find and add button to toolbar
  function addToToolbar() {
    // Find OHIF's main toolbar or header
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
    buttonContainer.id = 'export-zip-btn';
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

    // Add hover effects
    button.onmouseover = () => {
      button.style.background = '#4a5568';
      button.style.borderColor = '#718096';
    };

    button.onmouseout = () => {
      button.style.background = 'transparent';
      button.style.borderColor = '#4a5568';
    };

    // Export functionality - use the extension command that we know works
    button.onclick = () => {

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

      // Use the extension command that we proved works
      try {
        commandsManager.runCommand('exportViewportAsZip', {}, 'CORNERSTONE');

        // Reset button after a delay
        setTimeout(() => {
          button.innerHTML = originalHTML;
          button.disabled = false;
        }, 2000);

      } catch (error) {
        console.error('Export command failed:', error);
        alert('Export failed: ' + error.message);

        // Reset button
        button.innerHTML = originalHTML;
        button.disabled = false;
      }
    };

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
    }, 30000);
  }
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
