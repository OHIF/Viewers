import routeValidation from './routeValidation';

import log from '../../log.js';
jest.mock('../../log.js');

describe('Route Validation', () => {
  it('Module should export a class', () => {
    expect('constructor' in routeValidation).toBe(true);
    expect(typeof routeValidation).toBe('function');
  });
  it('Module structure should implement onValidationFail and runValidators methods', () => {
    const routeValidationObj = new routeValidation();
    expect('onValidationFail' in routeValidationObj).toBe(true);
    expect('runValidators' in routeValidationObj).toBe(true);
  });
  describe('onValidationFail method', () => {
    it('method should log the message based on env flag', () => {
      const routeValidationObj = new routeValidation();
      const failMessage = 'some useful message';

      const expectMethodToBeCalled = (message, logMethod) => {
        if (logMethod) {
          expect(logMethod.mock.calls.length).toBe(1);
          expect(logMethod.mock.calls[0][0]).toContain(message);
        }
      };

      const runMethodForGivenEnvProperty = (
        message,
        logMethod,
        validationMode
      ) => {
        process.env.ROUTES_VALIDATION_MODE = validationMode;
        routeValidationObj.onValidationFail(message);
        expectMethodToBeCalled(message, logMethod);

        if (logMethod) {
          logMethod.mockClear();
        }
        process.env.ROUTES_VALIDATION_MODE = undefined;
      };

      runMethodForGivenEnvProperty(failMessage, log.info);
      runMethodForGivenEnvProperty(failMessage, log.error, 'log');
      runMethodForGivenEnvProperty(failMessage, undefined, 'silent');
    });

    it('method should throw exception in case fail mode is fail', () => {
      const routeValidationObj = new routeValidation();
      const failMessage = 'some useful message';

      const runMethodForGivenEnvProperty = (message, validationMode) => {
        process.env.ROUTES_VALIDATION_MODE = validationMode;
        expect(() => {
          routeValidationObj.onValidationFail(message);
        }).toThrow(message);
        process.env.ROUTES_VALIDATION_MODE = undefined;
      };

      runMethodForGivenEnvProperty(failMessage, 'fail');
    });
  });
  describe('runValidators method', () => {
    it('method should run all passed validators', () => {
      const myMock1 = jest.fn(() => true);
      const myMock2 = jest.fn(() => true);
      const myMock3 = jest.fn(() => true);

      function* validators() {
        yield myMock1;
        yield myMock2;
        yield myMock3;
      }
      const validatorParam = { test: 1 };

      const routeValidationObj = new routeValidation();

      routeValidationObj.runValidators(validators, validatorParam);

      expect(myMock1.mock.calls.length).toBe(1);
      expect(myMock1.mock.calls[0][0]).toBe(validatorParam);
      expect(myMock2.mock.calls.length).toBe(1);
      expect(myMock2.mock.calls[0][0]).toBe(validatorParam);
      expect(myMock3.mock.calls.length).toBe(1);
      expect(myMock3.mock.calls[0][0]).toBe(validatorParam);
    });
    it('method should skip validators in case any has failed', () => {
      const myMock1 = jest.fn(() => true);
      const myMock2 = jest.fn(() => false);
      const myMock3 = jest.fn(() => true);

      function* validators() {
        yield myMock1;
        yield myMock2;
        yield myMock3;
      }
      const validatorParam = { test: 1 };

      const routeValidationObj = new routeValidation();

      routeValidationObj.runValidators(validators, validatorParam);

      expect(myMock1.mock.calls.length).toBe(1);
      expect(myMock1.mock.calls[0][0]).toBe(validatorParam);
      expect(myMock2.mock.calls.length).toBe(1);
      expect(myMock2.mock.calls[0][0]).toBe(validatorParam);
      // last one must be skipped
      expect(myMock3.mock.calls.length).toBe(0);
    });
  });
});
