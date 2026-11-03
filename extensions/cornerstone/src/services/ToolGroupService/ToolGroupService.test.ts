import { eventTarget } from '@cornerstonejs/core';
import { Enums } from '@cornerstonejs/tools';

import ToolGroupService from './ToolGroupService';

jest.mock('@cornerstonejs/tools', () => ({
  ...jest.requireActual('@cornerstonejs/tools'),
  ToolGroupManager: {
    destroy: jest.fn(),
  },
}));

const createService = () =>
  new ToolGroupService({
    services: {
      cornerstoneViewportService: {},
      viewportGridService: {},
      uiNotificationService: {},
      customizationService: {},
    },
  } as unknown as AppTypes.ServicesManager);

// What Cornerstone raises when a tool group arms a tool on the primary mouse button.
const activatePrimaryTool = (toolName: string) =>
  eventTarget.dispatchEvent(
    new CustomEvent(Enums.Events.TOOL_ACTIVATED, {
      detail: {
        toolGroupId: 'default',
        toolName,
        toolBindingsOptions: { bindings: [{ mouseButton: Enums.MouseBindings.Primary }] },
      },
    })
  );

describe('ToolGroupService tool activation across modes', () => {
  let service: ToolGroupService;

  afterEach(() => {
    service?.destroy();
  });

  it('announces a primary tool activation in the first mode', () => {
    service = createService();
    service.onModeEnter();
    const onPrimary = jest.fn();
    service.subscribe(service.EVENTS.PRIMARY_TOOL_ACTIVATED, onPrimary);

    activatePrimaryTool('SphereBrush');

    // Once, not twice: the constructor already registered the listener, and entering
    // the first mode must not add a second copy.
    expect(onPrimary).toHaveBeenCalledTimes(1);
    expect(onPrimary).toHaveBeenCalledWith(expect.objectContaining({ toolName: 'SphereBrush' }));
  });

  it('still announces it after the mode is left and entered again', () => {
    // Leaving the mode destroys the tool groups and, with them, the TOOL_ACTIVATED
    // listener. Switching study from inside the viewer is exactly this sequence, and
    // every subscriber to PRIMARY_TOOL_ACTIVATED went deaf after it.
    service = createService();
    service.onModeEnter();
    service.onModeExit();
    service.onModeEnter();
    const onPrimary = jest.fn();
    service.subscribe(service.EVENTS.PRIMARY_TOOL_ACTIVATED, onPrimary);

    activatePrimaryTool('SphereBrush');

    expect(onPrimary).toHaveBeenCalledTimes(1);
  });

  it('stays silent between leaving a mode and entering the next', () => {
    service = createService();
    service.onModeEnter();
    service.onModeExit();
    const onPrimary = jest.fn();
    service.subscribe(service.EVENTS.PRIMARY_TOOL_ACTIVATED, onPrimary);

    activatePrimaryTool('SphereBrush');

    expect(onPrimary).not.toHaveBeenCalled();
  });
});
