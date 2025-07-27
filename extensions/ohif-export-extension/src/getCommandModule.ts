import JSZip from 'jszip';

interface GetCommandsModuleParams {
  servicesManager: any;
}

interface ViewportState {
  activeViewportId: string;
  viewports: Map<string, any>;
}

interface Metadata {
  PatientName?: string;
  StudyDate?: string;
  StudyDescription?: string;
  SeriesDescription?: string;
  Modality?: string;
  StudyInstanceUID?: string;
  SeriesInstanceUID?: string;
  SOPInstanceUID?: string;
  exportDate?: string;
}

export default function getCommandsModule({ servicesManager }: GetCommandsModuleParams) {
  const { viewportGridService, displaySetService, uiNotificationService } = servicesManager.services;

  const exportAsZip = async (): Promise<void> => {
    try {
      console.log('Starting export process...');

      const { activeViewportId, viewports }: ViewportState = viewportGridService.getState();
      const activeViewport = viewports.get(activeViewportId);

      if (!activeViewport) {
        uiNotificationService.show({
          title: 'Export Failed',
          message: 'No active viewport found',
          type: 'error',
        });
        return;
      }

      const viewportElement = activeViewport.element;
      const canvas = viewportElement.querySelector('canvas') as HTMLCanvasElement;

      if (!canvas) {
        uiNotificationService.show({
          title: 'Export Failed',
          message: 'No canvas found in viewport',
          type: 'error',
        });
        return;
      }

      const imageBlob: Blob = await new Promise(resolve => {
        canvas.toBlob(resolve as BlobCallback, 'image/jpeg', 0.9);
      });

      const displaySets = displaySetService.getActiveDisplaySets();
      const activeDisplaySet = displaySets[0];

      let metadata: Metadata = {};
      if (activeDisplaySet?.instances?.length > 0) {
        const instance = activeDisplaySet.instances[0];
        metadata = {
          PatientName: instance.PatientName?.Alphabetic || 'Unknown',
          StudyDate: instance.StudyDate || 'Unknown',
          StudyDescription: instance.StudyDescription || '',
          SeriesDescription: instance.SeriesDescription || '',
          Modality: instance.Modality || '',
          StudyInstanceUID: instance.StudyInstanceUID || '',
          SeriesInstanceUID: instance.SeriesInstanceUID || '',
          SOPInstanceUID: instance.SOPInstanceUID || '',
          exportDate: new Date().toISOString(),
        };
      }

      const zip = new JSZip();
      zip.file('image.jpg', imageBlob);
      zip.file('metadata.json', JSON.stringify(metadata, null, 2));

      const zipBlob: Blob = await zip.generateAsync({ type: 'blob' });

      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_${metadata.PatientName || 'unknown'}_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      uiNotificationService.show({
        title: 'Export Successful',
        message: 'Image and metadata exported successfully',
        type: 'success',
      });

      console.log('Export completed successfully');

    } catch (error) {
      console.error('Export failed:', error);
      uiNotificationService.show({
        title: 'Export Failed',
        message: (error as Error).message || 'An error occurred during export',
        type: 'error',
      });
    }
  };

  return {
    actions: {
      exportAsZip,
    },
    definitions: {
      exportAsZip: {
        commandFn: 'exportAsZip',
        storeContexts: [],
        options: {},
      },
    },
  };
}
