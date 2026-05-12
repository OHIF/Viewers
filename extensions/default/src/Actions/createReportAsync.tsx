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

    // addInstances is called by the store command (storeMeasurements/storeSegmentation),
    // so the display set should already exist at this point.
    const displaySet = displaySetService.getMostRecentDisplaySet();

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
