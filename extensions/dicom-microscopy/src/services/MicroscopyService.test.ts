import MicroscopyService from './MicroscopyService';

describe('MicroscopyService.toggleROIsVisibility', () => {
  function createService() {
    const service = new MicroscopyService({
      servicesManager: {},
      extensionManager: { appConfig: {} },
    });
    const managedViewer = { hideROIs: jest.fn(), showROIs: jest.fn() };
    service.managedViewers.add(managedViewer);
    return { service, managedViewer };
  }

  it('hides the ROIs of the managed viewers on the first toggle', () => {
    const { service, managedViewer } = createService();

    service.toggleROIsVisibility();

    expect(managedViewer.hideROIs).toHaveBeenCalledTimes(1);
    expect(managedViewer.showROIs).not.toHaveBeenCalled();
    expect(service.isROIsVisible).toBe(false);
  });

  it('shows the ROIs of the managed viewers again on the second toggle', () => {
    const { service, managedViewer } = createService();

    service.toggleROIsVisibility();
    service.toggleROIsVisibility();

    expect(managedViewer.hideROIs).toHaveBeenCalledTimes(1);
    expect(managedViewer.showROIs).toHaveBeenCalledTimes(1);
    expect(service.isROIsVisible).toBe(true);
  });
});
