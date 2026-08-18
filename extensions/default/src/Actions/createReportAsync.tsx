/**
 *
 * @param {*} servicesManager
 */
async function createReportAsync({
  servicesManager,
  getReport,
  reportType = 'Measurements',
  successMessage,
}: withAppTypes) {
  const { displaySetService, uiNotificationService, uiDialogService } = servicesManager.services;

  try {
    const naturalizedReport = await getReport();

    if (!naturalizedReport) {
      return;
    }

    console.log('naturalizedReport:', naturalizedReport);

    // Check if naturalizedReport has dataset property (for segmentation)
    if (naturalizedReport.dataset) {
      if (!naturalizedReport.dataset.InstanceNumber) {
        console.warn('Dataset missing InstanceNumber, setting default value');
        naturalizedReport.dataset.InstanceNumber = 1;
      }
    }

    // addInstances is called by the store command (storeMeasurements/storeSegmentation),
    // so the display set should already exist at this point.
    const displaySet = displaySetService.getMostRecentDisplaySet();

    if (!displaySet) {
      throw new Error('No display set found for segmentation');
    }

    const displaySetInstanceUID = displaySet.displaySetInstanceUID;

    uiNotificationService.show({
      title: 'Create Report',
      message: successMessage ?? `${reportType} saved successfully`,
      type: 'success',
    });

    return [displaySetInstanceUID];
  } catch (error) {
    uiNotificationService.show({
      title: 'Create Report',
      message: error.message || `Failed to store ${reportType}`,
      type: 'error',
    });
    throw new Error(`Failed to store ${reportType}. Error: ${error.message || 'Unknown error'}`);
  } finally {
    uiDialogService.hide('loading-dialog');
  }
}

export default createReportAsync;
