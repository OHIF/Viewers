import pathValidation from './pathValidation';
import routeValidation from './routeValidation';
import {
  validPathDefinition1,
  validPathDefinition2,
  duplicatedNoHomePathDefinition1,
  duplicatedNoHomePathDefinition2,
  duplicatedNoHomePathDefinition3,
  duplicatedNoHomePathDefinition4,
} from './testData';

describe('Path Validation', () => {
  it('Module should export an object', () => {
    expect(typeof pathValidation).toBe('object');
  });
  it('Module structure should extend PathValidation class', () => {
    expect(pathValidation instanceof routeValidation).toBe(true);
  });
  it('Module structure should implement preValidators, runPreValidation, uniquenessValidation and existingHomeValidation methods', () => {
    expect('preValidators' in pathValidation).toBe(true);
    expect(typeof pathValidation.preValidators).toBe('function');
    expect('runPreValidation' in pathValidation).toBe(true);
    expect(typeof pathValidation.runPreValidation).toBe('function');
    expect('uniquenessValidation' in pathValidation).toBe(true);
    expect(typeof pathValidation.uniquenessValidation).toBe('function');
    expect('existingHomeValidation' in pathValidation).toBe(true);
    expect(typeof pathValidation.existingHomeValidation).toBe('function');
  });
  describe('preValidators method', () => {
    it('method should yield pre validators', () => {
      expect(pathValidation.preValidators.constructor.name).toBe(
        'GeneratorFunction'
      );
      const validator = pathValidation.preValidators();
      expect('next' in validator).toBe(true);
      expect(
        validator.next().value === pathValidation.uniquenessValidation
      ).toBe(true);
      expect(
        validator.next().value === pathValidation.existingHomeValidation
      ).toBe(true);
    });
  });
  describe('runPreValidation method', () => {
    it('method should run pre validators', () => {
      function* mockPreValidatorsGenerator() {
        yield () => true;
        yield () => true;
      }
      const mockPreValidators = jest.fn();
      mockPreValidators.mockReturnValue(mockPreValidatorsGenerator());
      const oldPrevalidators = pathValidation.preValidators;
      pathValidation.preValidators = mockPreValidators;
      const validatorParam = { test: 1 };

      pathValidation.runPreValidation(validatorParam);
      expect(mockPreValidators.mock.calls.length).toBe(1);
      pathValidation.preValidators = oldPrevalidators;
    });
  });
  describe('uniquenessValidation method', () => {
    it('method should return true in case success', () => {
      let result = pathValidation.uniquenessValidation(validPathDefinition1);
      expect(result).toBe(true);
      result = pathValidation.uniquenessValidation(validPathDefinition2);
      expect(result).toBe(true);
    });
    it('method should return false or throw exception in case fail', () => {
      let result = pathValidation.uniquenessValidation(
        duplicatedNoHomePathDefinition1
      );
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation(
        duplicatedNoHomePathDefinition2
      );
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation(
        duplicatedNoHomePathDefinition3
      );
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation(
        duplicatedNoHomePathDefinition4
      );
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation([]);
      expect(result).toBe(false);
    });
  });

  describe('existingHomeValidation method', () => {
    it('method should return true in case success', () => {
      let result = pathValidation.existingHomeValidation(validPathDefinition1);
      expect(result).toBe(true);
      result = pathValidation.existingHomeValidation(validPathDefinition2);
      expect(result).toBe(true);
    });
    it('method should return false or throw exception in case fail', () => {
      let result = pathValidation.existingHomeValidation(
        duplicatedNoHomePathDefinition1
      );
      expect(result).toBe(false);
      result = pathValidation.existingHomeValidation(
        duplicatedNoHomePathDefinition2
      );
      expect(result).toBe(false);
      result = pathValidation.existingHomeValidation(
        duplicatedNoHomePathDefinition3
      );
      expect(result).toBe(false);
      result = pathValidation.existingHomeValidation(
        duplicatedNoHomePathDefinition4
      );
      expect(result).toBe(false);
      result = pathValidation.existingHomeValidation([]);
      expect(result).toBe(false);
    });
  });
});
