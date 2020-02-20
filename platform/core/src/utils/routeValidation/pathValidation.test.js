import pathValidation from './pathValidation';
import routeValidation from './routeValidation';

const validPathDefinition1 = [
  {
    template: 'one',
    path: '/one',
  },
  {
    template: 'two',
    path: '/two',
  },
  {
    template: 'three',
    path: '/three',
  },
];

const validPathDefinition2 = [
  {
    template: 'one',
    path: '/one',
  },
  {
    template: 'two',
    path: ['/two', '/four'],
  },
  {
    template: 'three',
    path: '/three',
  },
];

const duplicatedPathDefinition1 = [
  {
    template: 'one',
    path: '/one',
  },
  {
    template: 'two',
    path: '/one',
  },
  {
    template: 'three',
    path: '/three',
  },
];

const duplicatedPathDefinition2 = [
  {
    template: 'one',
    path: '/one',
  },
  {
    template: 'two',
    path: ['/one'],
  },
  {
    template: 'three',
    path: '/three',
  },
];

const duplicatedPathDefinition3 = [
  {
    template: 'one',
    path: '/one',
  },
  {
    template: 'two',
    path: ['/one', '/two'],
  },
  {
    template: 'three',
    path: '/three',
  },
];

const duplicatedPathDefinition4 = [
  {
    template: 'one',
    path: '/one',
  },
  {
    template: 'two',
    path: ['/two', '/two'],
  },
  {
    template: 'three',
    path: '/three',
  },
];
describe('Path Validation', () => {
  it('Module should export an object', () => {
    expect(typeof pathValidation).toBe('object');
  });
  it('Module structure should extend PathValidation class', () => {
    expect(pathValidation instanceof routeValidation).toBe(true);
  });
  it('Module structure should implement preValidators, runPreValidation and uniquenessValidation methods', () => {
    expect('preValidators' in pathValidation).toBe(true);
    expect(typeof pathValidation.preValidators).toBe('function');
    expect('runPreValidation' in pathValidation).toBe(true);
    expect(typeof pathValidation.runPreValidation).toBe('function');
    expect('uniquenessValidation' in pathValidation).toBe(true);
    expect(typeof pathValidation.uniquenessValidation).toBe('function');
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
    });
  });
  describe('runPreValidation method', () => {
    it('method should run pre validators', () => {
      function* mockPreValidatorsGenerator() {
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
        duplicatedPathDefinition1
      );
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation(duplicatedPathDefinition2);
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation(duplicatedPathDefinition3);
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation(duplicatedPathDefinition4);
      expect(result).toBe(false);
      result = pathValidation.uniquenessValidation([]);
      expect(result).toBe(false);
    });
  });
});
