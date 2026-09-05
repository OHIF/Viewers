import ToolbarService from '../ToolbarService';

const BUTTON_UI_TYPE = 'ohif.radioGroup';

function createService() {
  const commandsManager = { run: jest.fn() };
  const extensionManager = {
    modules: {
      toolbarModule: [
        { module: [{ name: BUTTON_UI_TYPE, defaultComponent: () => null }] },
      ],
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
  it('keeps the button definition as the source of truth across repeated refreshes', () => {
    const { service } = createService();
    const option = { id: 'radius', value: 5, commands: [] };
    addButtonWithOption(service, option);

    // Every refresh re-wraps the button's options. If a refresh wrapped the
    // previous wrapper instead of the original, onChange would write to that
    // intermediate object and the button's own option would go stale.
    currentOption(service);
    currentOption(service);
    currentOption(service).onChange(42);

    expect(option.value).toBe(42);
  });

  it('returns a fresh wrapper over the same option on each refresh', () => {
    const { service } = createService();
    const option = { id: 'radius', value: 5, commands: [] };
    addButtonWithOption(service, option);

    const first = currentOption(service);
    const second = currentOption(service);

    // Each refresh yields a fresh wrapper over the same original, so the
    // wrapper never nests: its own enumerable shape stays that of the original.
    expect(Object.keys(second).sort()).toEqual(Object.keys(first).sort());
    expect(second).not.toBe(first);
    expect(second.id).toBe('radius');
  });

  it('anchors every wrapper to the definition, never to the previous wrapper', () => {
    const { service } = createService();
    const option = { id: 'radius', value: 5, commands: [] };
    addButtonWithOption(service, option);

    const wrappers = [currentOption(service), currentOption(service), currentOption(service)];

    const { _pristineOptions } = service as unknown as {
      _pristineOptions: WeakMap<object, object>;
    };

    // This is what keeps the closure chain from forming: onChange closes over
    // whatever this resolves to, so it must be the definition every time. If a
    // refresh anchored to the previous wrapper, each closure would retain the
    // one before it and the chain would grow by one per refresh.
    for (const wrapper of wrappers) {
      expect(_pristineOptions.get(wrapper)).toBe(option);
    }
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
});
