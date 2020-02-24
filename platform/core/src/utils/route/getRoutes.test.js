import getRoutes from './getRoutes';
import pathValidation from './pathValidation';
import getRoutesDefinitions, * as _module from './getRoutesDefinitions';
import {
  appConfig1,
  appConfig2,
  defaultPathDefinition1,
  resultRouteDefinition1,
  resultRouteDefinition2,
  routeTemplatesModulesExtensions1,
  routeTemplatesModulesExtensions2,
  resultRoutes1,
  resultRoutes2,
} from './testData';
jest.spyOn(_module, 'default');
jest.mock('./pathValidation');

describe('getRoutes', () => {
  beforeEach(() => {
    process.env.ROUTES_VALIDATION_MODE = 'silent';
  });
  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Module should export by default getRoutes method', () => {
    expect(typeof getRoutes).toBe('function');
  });

  describe('getRoutes method', () => {
    describe('structural tests', () => {
      it('it should call getRoutesDefinitions', () => {
        const result = getRoutes(appConfig1, undefined, defaultPathDefinition1);

        expect(getRoutesDefinitions.mock.calls.length).toBe(1);
        expect(getRoutesDefinitions.mock.calls[0][0]).toBe(appConfig1);
        expect(getRoutesDefinitions.mock.calls[0][1]).toBe(
          defaultPathDefinition1
        );
      });
      it('it should run validations', () => {
        const result = getRoutes(appConfig1, undefined, defaultPathDefinition1);

        expect(pathValidation.runPreValidation).toHaveBeenCalled();
      });
    });
    describe('fail cases', () => {
      it('it should return empty array in case there are missing params', () => {
        let result = getRoutes({}, undefined, []);

        expect(result.length).toBe(0);

        result = getRoutes({ routes: [] }, undefined, []);

        expect(result.length).toBe(0);
      });

      it('it should return empty array in case there are invalid params and fail mode on', () => {
        process.env.ROUTES_VALIDATION_MODE = 'fail';
        let result = getRoutes(appConfig1, undefined, defaultPathDefinition1);

        expect(result.length).toBe(0);
      });

      it('it should return empty array in case there is route template param', () => {
        let result = getRoutes(appConfig1, undefined, defaultPathDefinition1);

        expect(result.length).toBe(0);
      });
    });

    describe('success cases', () => {
      beforeAll(() => {
        jest.restoreAllMocks();
      });

      const expectToBeEqual = (result, toCompare) => {
        expect(typeof result === 'object').toEqual(true);
        expect(result.length).toEqual(toCompare.length);

        if (toCompare.length) {
          for (let resultItem of result) {
            expect(toCompare).toContainEqual(resultItem);
          }
        }
      };

      it('it should return valid route in case all params are valid', () => {
        let result = getRoutes(
          appConfig1,
          routeTemplatesModulesExtensions1,
          defaultPathDefinition1
        );

        expectToBeEqual(result, resultRoutes1);

        result = getRoutes(
          appConfig2,
          routeTemplatesModulesExtensions2,
          defaultPathDefinition1
        );

        expectToBeEqual(result, resultRoutes2);
      });
    });
  });
});
