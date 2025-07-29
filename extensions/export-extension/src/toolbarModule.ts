/**
 * Toolbar module for export functionality
 */
export function getToolbarModule() {
  return [
    {
      name: 'ExportZip',
      id: 'ExportZip',
      icon: 'tool-download',
      label: 'Export ZIP',
      tooltip: 'Export current viewport as ZIP file with image and metadata',
      commands: [
        {
          commandName: 'exportViewportAsZip',
          context: 'CORNERSTONE', // Changed from 'EXPORT' to 'CORNERSTONE'
        },
      ],
    },
  ];
}
