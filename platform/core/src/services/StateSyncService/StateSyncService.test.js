import StateSyncService from './StateSyncService';
import log from '../../log';

jest.mock('../../log.js', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const extensionManager = {};

describe('StateSyncService.ts', () => {
  let stateSyncService;

  let configuration;

  beforeEach(() => {
    log.warn.mockClear();
    jest.clearAllMocks();
    configuration = {};
    stateSyncService = new StateSyncService({
      configuration,
    });
  });

  describe('init', () => {
    it('init succeeds', () => {
      stateSyncService.init(extensionManager);
    });
  });
});
