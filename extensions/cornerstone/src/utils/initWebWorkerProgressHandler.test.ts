import { eventTarget, EVENTS } from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import { initializeWebWorkerProgressHandler } from './initWebWorkerProgressHandler';

jest.mock('@cornerstonejs/core', () => ({
  eventTarget: {
    addEventListener: jest.fn(),
  },
  EVENTS: {
    WEB_WORKER_PROGRESS: 'WEB_WORKER_PROGRESS',
  },
}));

jest.mock('@cornerstonejs/tools', () => ({
  Enums: {
    WorkerTypes: {
      COMPUTE_STATISTICS: 'COMPUTE_STATISTICS',
    },
  },
}));

describe('initializeWebWorkerProgressHandler', () => {
  const mockUINotificationService = {
    show: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'debug').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should register event listener for WEB_WORKER_PROGRESS', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    expect(eventTarget.addEventListener).toHaveBeenCalledWith(
      EVENTS.WEB_WORKER_PROGRESS,
      expect.any(Function)
    );
  });

  it('should skip notifications for COMPUTE_STATISTICS worker type', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: cornerstoneTools.Enums.WorkerTypes.COMPUTE_STATISTICS,
      id: 'test-id',
    };

    eventHandler({ detail });

    expect(mockUINotificationService.show).not.toHaveBeenCalled();
  });

  it('should show notification when progress is 0 for new task', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    eventHandler({ detail });

    expect(mockUINotificationService.show).toHaveBeenCalledWith({
      id: 'worker-task-test_worker',
      title: 'TEST_WORKER',
      message: 'Computing...',
      autoClose: false,
      allowDuplicates: false,
      deduplicationInterval: 60000,
      promise: expect.any(Promise),
      promiseMessages: {
        loading: 'Computing...',
        success: 'Completed successfully',
        error: 'Web Worker failed',
      },
    });
  });

  it('should not show duplicate notification for same task type', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: 'TEST_WORKER',
      id: 'test-id-1',
    };

    eventHandler({ detail });
    eventHandler({ detail: { ...detail, id: 'test-id-2' } });

    expect(mockUINotificationService.show).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenCalledWith(
      'Already tracking a "TEST_WORKER" task, skipping duplicate notification'
    );
  });

  it('should resolve promise when progress is 100', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];

    const startDetail = {
      progress: 0,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    eventHandler({ detail: startDetail });

    const completeDetail = {
      progress: 100,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    eventHandler({ detail: completeDetail });

    expect(console.debug).toHaveBeenCalledWith('Worker task "TEST_WORKER" completed successfully');
  });

  it('should handle completion for non-tracked task gracefully', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 100,
      type: 'UNKNOWN_WORKER',
      id: 'test-id',
    };

    eventHandler({ detail });

    expect(console.debug).not.toHaveBeenCalledWith(
      'Worker task "UNKNOWN_WORKER" completed successfully'
    );
  });

  it('should normalize task keys correctly', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: 'Test Worker Type',
      id: 'test-id',
    };

    eventHandler({ detail });

    expect(mockUINotificationService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'worker-task-test-worker-type',
      })
    );
  });

  it('should handle error when setting active worker task', () => {
    jest.spyOn(global, 'Promise').mockImplementationOnce(() => {
      throw new Error('Promise creation failed');
    });

    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    expect(() => eventHandler({ detail })).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Error in web worker progress handler for type "TEST_WORKER":',
      expect.any(Error)
    );

    jest.restoreAllMocks();
  });

  it('should handle error when showing notification', () => {
    mockUINotificationService.show.mockImplementationOnce(() => {
      throw new Error('Notification service failed');
    });

    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    expect(() => eventHandler({ detail })).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Error showing web worker notification for type "TEST_WORKER":',
      expect.any(Error)
    );
  });

  it('should handle missing detail object', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];

    expect(() => eventHandler({})).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Error in web worker progress handler for type "undefined":',
      expect.any(Error)
    );
  });

  it('should handle undefined detail', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];

    expect(() => eventHandler({ detail: undefined })).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Error in web worker progress handler for type "undefined":',
      expect.any(Error)
    );
  });

  it('should handle cleanup error gracefully', () => {
    const mockMap = new Map();
    mockMap.delete = jest.fn(() => {
      throw new Error('Delete failed');
    });

    jest.spyOn(global, 'Map').mockImplementationOnce(() => mockMap);

    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    mockUINotificationService.show.mockImplementationOnce(() => {
      throw new Error('Notification failed');
    });

    expect(() => eventHandler({ detail })).not.toThrow();
    expect(console.error).toHaveBeenCalledWith(
      'Error cleaning up active worker task for type "TEST_WORKER":',
      expect.any(Error)
    );

    jest.restoreAllMocks();
  });

  it('should handle intermediate progress values', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];

    const startDetail = {
      progress: 0,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    eventHandler({ detail: startDetail });

    const intermediateDetail = {
      progress: 50,
      type: 'TEST_WORKER',
      id: 'test-id',
    };

    eventHandler({ detail: intermediateDetail });

    expect(mockUINotificationService.show).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple different worker types simultaneously', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];

    const detail1 = {
      progress: 0,
      type: 'WORKER_TYPE_1',
      id: 'test-id-1',
    };

    const detail2 = {
      progress: 0,
      type: 'WORKER_TYPE_2',
      id: 'test-id-2',
    };

    eventHandler({ detail: detail1 });
    eventHandler({ detail: detail2 });

    expect(mockUINotificationService.show).toHaveBeenCalledTimes(2);
    expect(mockUINotificationService.show).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        id: 'worker-task-worker_type_1',
        title: 'WORKER_TYPE_1',
      })
    );
    expect(mockUINotificationService.show).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        id: 'worker-task-worker_type_2',
        title: 'WORKER_TYPE_2',
      })
    );
  });

  it('should complete multiple worker types independently', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];

    eventHandler({ detail: { progress: 0, type: 'WORKER_1', id: 'id-1' } });
    eventHandler({ detail: { progress: 0, type: 'WORKER_2', id: 'id-2' } });
    eventHandler({ detail: { progress: 100, type: 'WORKER_1', id: 'id-1' } });

    expect(console.debug).toHaveBeenCalledWith('Worker task "WORKER_1" completed successfully');

    eventHandler({ detail: { progress: 100, type: 'WORKER_2', id: 'id-2' } });

    expect(console.debug).toHaveBeenCalledWith('Worker task "WORKER_2" completed successfully');
  });

  it('should handle special characters in worker type names', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: 'Test-Worker_Type@123',
      id: 'test-id',
    };

    eventHandler({ detail });

    expect(mockUINotificationService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'worker-task-test-worker_type@123',
      })
    );
  });

  it('should handle empty worker type', () => {
    initializeWebWorkerProgressHandler(mockUINotificationService);

    const eventHandler = (eventTarget.addEventListener as jest.Mock).mock.calls[0][1];
    const detail = {
      progress: 0,
      type: '',
      id: 'test-id',
    };

    eventHandler({ detail });

    expect(mockUINotificationService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'worker-task-',
        title: '',
      })
    );
  });
});
