import { act } from 'react';
import { renderHook } from '@testing-library/react';
import { useToolbar } from '../useToolbar';
import { useSystem } from '../../contextProviders/SystemProvider';

type MockSubscription = { unsubscribe: jest.Mock<void, []> };

type MockToolbarService = {
  EVENTS: Record<string, string>;
  getButtonSection: jest.Mock<any[], [string]>;
  getButtonProps: jest.Mock<any, [string]>;
  recordInteraction: jest.Mock;
  subscribe: jest.Mock<MockSubscription, [string, (args: any) => void]>;
  getButton: jest.Mock<any, [string]>;
  refreshToolbarState: jest.Mock;
};

type MockViewportGridService = {
  EVENTS: Record<string, string>;
  subscribe: jest.Mock<MockSubscription, [string, (args: any) => void]>;
  getActiveViewportId: jest.Mock<string, []>;
};

jest.mock('../../contextProviders/SystemProvider', () => ({
  useSystem: jest.fn(),
}));

const mockedUseSystem = useSystem as jest.MockedFunction<typeof useSystem>;

const createToolbarService = (): MockToolbarService => ({
  EVENTS: {
    TOOL_BAR_MODIFIED: 'TOOL_BAR_MODIFIED',
    TOOL_BAR_STATE_MODIFIED: 'TOOL_BAR_STATE_MODIFIED',
  },
  getButtonSection: jest.fn().mockReturnValue([]),
  getButtonProps: jest.fn().mockReturnValue({}),
  recordInteraction: jest.fn(),
  subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
  getButton: jest.fn(),
  refreshToolbarState: jest.fn(),
});

const createViewportGridService = (): MockViewportGridService => ({
  EVENTS: {
    ACTIVE_VIEWPORT_ID_CHANGED: 'ACTIVE_VIEWPORT_ID_CHANGED',
    VIEWPORTS_READY: 'VIEWPORTS_READY',
    LAYOUT_CHANGED: 'LAYOUT_CHANGED',
  },
  subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
  getActiveViewportId: jest.fn().mockReturnValue('ACTIVE_VIEWPORT'),
});

describe('useToolbar', () => {
  let toolbarService: MockToolbarService;
  let viewportGridService: MockViewportGridService;
  let commandsManager: { run: jest.Mock };
  let servicesManager: {
    services: { toolbarService: MockToolbarService; viewportGridService: MockViewportGridService };
  };

  const renderToolbarHook = () => renderHook(() => useToolbar({ buttonSection: 'primary' } as any));

  beforeEach(() => {
    toolbarService = createToolbarService();
    viewportGridService = createViewportGridService();
    commandsManager = { run: jest.fn() };
    servicesManager = { services: { toolbarService, viewportGridService } };

    mockedUseSystem.mockReset();
    mockedUseSystem.mockReturnValue({
      commandsManager,
      servicesManager,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('aggregates commands on interaction and defers execution to the commands manager', () => {
    const stopPropagation = jest.fn();

    const option = {
      id: 'option-1',
      value: 'opt-1',
      commands: 'secondaryCommand',
      label: 'Option 1',
    };
    const ignoredOption = {
      id: 'option-ignored',
      value: 'ignored',
      explicitRunOnly: true,
      commands: ['ignoredCommand'],
    };

    toolbarService.getButtonProps.mockReturnValue({
      commands: ['primaryCommand'],
      options: [option, ignoredOption],
    });

    const { result } = renderToolbarHook();

    act(() => {
      result.current.onInteraction({
        itemId: 'test-button',
        viewportId: 'custom-viewport',
        event: { stopPropagation },
      });
    });

    expect(stopPropagation).toHaveBeenCalledTimes(1);
    expect(toolbarService.getButtonProps).toHaveBeenCalledWith('test-button');

    const [interactionArgs, interactionMeta] = toolbarService.recordInteraction.mock.calls[0];
    const { commands } = interactionArgs;

    expect(commands).toHaveLength(2);
    commands.forEach(commandFn => expect(typeof commandFn).toBe('function'));

    (commands[0] as () => void)();
    expect(commandsManager.run).toHaveBeenLastCalledWith(
      'primaryCommand',
      expect.objectContaining({
        itemId: 'test-button',
        viewportId: 'custom-viewport',
        event: expect.any(Object),
      })
    );

    (commands[1] as () => void)();
    expect(commandsManager.run).toHaveBeenLastCalledWith(
      'secondaryCommand',
      expect.objectContaining({
        id: 'option-1',
        value: 'opt-1',
        options: expect.any(Array),
        servicesManager,
        commandsManager,
      })
    );

    expect(interactionMeta).toEqual({ refreshProps: { viewportId: 'custom-viewport' } });
  });

  it('keeps button props immutable when aggregating commands', () => {
    const stopPropagation = jest.fn();
    const option = {
      id: 'option-1',
      value: 'opt-1',
      commands: 'secondaryCommand',
      label: 'Option 1',
    };
    const ignoredOption = {
      id: 'option-ignored',
      value: 'ignored',
      explicitRunOnly: true,
      commands: ['ignoredCommand'],
    };
    const buttonProps = {
      commands: ['primaryCommand'],
      options: [option, ignoredOption],
    };

    toolbarService.getButtonProps.mockReturnValue(buttonProps);

    const { result } = renderToolbarHook();

    act(() => {
      result.current.onInteraction({
        itemId: 'test-button',
        viewportId: 'custom-viewport',
        event: { stopPropagation },
      });
    });

    act(() => {
      result.current.onInteraction({
        itemId: 'test-button',
        viewportId: 'custom-viewport',
        event: { stopPropagation },
      });
    });

    expect(stopPropagation).toHaveBeenCalledTimes(2);
    expect(buttonProps.commands).toHaveLength(1);
    expect(toolbarService.recordInteraction).toHaveBeenCalledTimes(2);
  });
});
