/**
 * Toolbar module for export functionality
 */
export function getToolbarModule() {
  return [
    {
      name: 'ExportZip',
      id: 'ExportZip',
      Icon: 'icon-download',
      label: 'Export ZIP',
      tooltip: 'Export current viewport as ZIP file with image and metadata',
      commands: [
        {
          commandName: 'exportViewportAsZip',
          context: 'EXPORT',
        },
      ],
    },
  ];
}
