interface GetToolbarModuleParams {
  commandsManager: any;
  servicesManager: any;
}

export default function getToolbarModule({ commandsManager, servicesManager }: GetToolbarModuleParams) {
  return [
    {
      name: 'ExportZip',
      type: 'ohif.action',
      props: {
        id: 'ExportZip',
        label: 'Export as ZIP',
        icon: 'icon-export', // You might need to use a different icon
        tooltip: 'Export current image and metadata as ZIP file',
        isActive: false,
        onClick: () => {
          console.log('Export ZIP button clicked');
          commandsManager.runCommand('exportAsZip');
        },
      },
    },
  ];
}
