import ToolbarService from '../ToolbarService';

const BUTTON_UI_TYPE = 'ohif.radioGroup';

function createService() {
  const commandsManager = { run: jest.fn() };
  const extensionManager = {
    modules: {
      toolbarModule: [{ module: [{ name: BUTTON_UI_TYPE, defaultComponent: () => null }] }],
    },
  };
  const servicesManager = { services: {} };

  return {
    commandsManager,
    service: new ToolbarService(
      commandsManager as never,
      extensionManager as never,
      servicesManager as never
    ),
  };
}

/** A single-button section whose one option the service will wrap. */
function addButtonWithOption(service, option) {
  service.register([
    {
      id: 'brush',
      uiType: BUTTON_UI_TYPE,
      props: { id: 'brush', options: [option] },
    },
  ]);
  service.updateSection('primary', ['brush']);
}

function currentOption(service) {
  return service.getButtonSection('primary')[0].componentProps.options[0];
}

/**
 * A nested button whose child carries the option. The child id is deliberately
 * not registered as a top-level button, which is how the segmentation toolbox
 * is built — `getButtonProps(item.id)` finds nothing for it.
 */
function addNestedButtonWithOption(service, option) {
  service.register([
    {
      id: 'toolbox',
      uiType: BUTTON_UI_TYPE,
      props: {
        id: 'toolbox',
        items: [{ id: 'brush', options: [option] }],
      },
    },
  ]);
  service.updateSection('primary', ['toolbox']);
}

function currentNestedOption(service) {
  return service.getButtonSection('primary')[0].componentProps.items[0].options[0];
}

describe('ToolbarService option enhancement', () => {
  it('writes onChange values to the live option after repeated refreshes', () => {
    const { service } = createService();
    addButtonWithOption(service, { id: 'radius', value: 5, commands: [] });

    // A stale wrapper from an earlier refresh must also write to the live option.
    const stale = currentOption(service);
    currentOption(service);
    currentOption(service);
    stale.onChange(42);

    expect(service.getButtonProps('brush').options[0].value).toBe(42);
    expect(currentOption(service).value).toBe(42);
  });

  it('keeps live values an evaluate function wrote onto the button props', () => {
    const { service } = createService();
    addButtonWithOption(service, { id: 'radius', value: 25, commands: [] });

    currentOption(service);
    // Evaluate functions run before the options are wrapped and write live tool
    // state onto whatever option object is on the button props at that moment
    // (see evaluate.cornerstone.segmentation.synchronizeDrawingRadius). The next
    // wrap has to carry that value through, not reset it to the definition's.
    service.getButtonProps('brush').options[0].value = 19;

    expect(currentOption(service).value).toBe(19);
  });

  it('keeps live values on nested buttons too', () => {
    const { service } = createService();
    addNestedButtonWithOption(service, { id: 'radius', value: 25, commands: [] });

    currentNestedOption(service);
    service.getButtonProps('toolbox').items[0].options[0].value = 19;

    expect(currentNestedOption(service).value).toBe(19);
  });

  it('still runs the option commands and broadcasts the state change', () => {
    const { service, commandsManager } = createService();
    const option = { id: 'radius', value: 5, commands: ['setBrushSize'] };
    addButtonWithOption(service, option);

    const onStateModified = jest.fn();
    service.subscribe(service.EVENTS.TOOL_BAR_STATE_MODIFIED, onStateModified);

    currentOption(service).onChange(9);

    expect(commandsManager.run).toHaveBeenCalledWith(
      'setBrushSize',
      expect.objectContaining({ value: 9, id: 'radius' })
    );
    expect(onStateModified).toHaveBeenCalled();
  });

  it('runs the option commands of a nested button that is not registered on its own', () => {
    const { service, commandsManager } = createService();
    addNestedButtonWithOption(service, { id: 'radius', value: 5, commands: ['setBrushSize'] });

    currentNestedOption(service).onChange(9);

    expect(service.getButtonProps('toolbox').items[0].options[0].value).toBe(9);
    expect(commandsManager.run).toHaveBeenCalledWith(
      'setBrushSize',
      expect.objectContaining({ value: 9, id: 'radius' })
    );
  });
});
