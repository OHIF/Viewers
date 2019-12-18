import MeasurementService from './MeasurementService.js';
import log from '../../log';

jest.mock('../../log.js');

describe('MeasurementService.js', () => {
  let measurementService;

  beforeEach(() => {
    measurementService = new MeasurementService();
    log.warn.mockClear();
    jest.clearAllMocks();
  });

  describe('addOrUpdate()', () => {
    it('something...', () => {});
  });

  describe('subscribe()', () => {
    it('something...', () => {});
  });

  describe('registerEvent()', () => {
    it('something...', () => {});
  });
});
