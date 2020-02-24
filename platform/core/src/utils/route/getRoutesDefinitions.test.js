import getRoutesDefinitions from './getRoutesDefinitions';
import {
  appConfig1,
  appConfig2,
  defaultPathDefinition1,
  resultRouteDefinition1,
  resultRouteDefinition2,
} from './testData';

describe('getRoutesDefinitions method', () => {
  const expectToBeEqual = (result, toCompare) => {
    expect(typeof result === 'object').toEqual(true);
    expect(result.length).toEqual(toCompare.length);

    if (toCompare.length) {
      for (let resultItem of result) {
        expect(toCompare).toContainEqual(resultItem);
      }
    }
  };

  it('Module should export by default getRoutesDefinitions method', () => {
    expect(typeof getRoutesDefinitions).toBe('function');
  });

  it('it should return empty array when there is no specific route definition or neither default route definition', () => {
    let result = getRoutesDefinitions({}, []);
    expectToBeEqual(result, []);

    result = getRoutesDefinitions({}, undefined);
    expectToBeEqual(result, []);
  });

  it('it should throw an error in case invalid appConfig is passed', () => {
    expect(() => {
      let result = getRoutesDefinitions(undefined, []);
    }).toThrow();
  });

  it('it should return route definitions and specific must have higher precedence in case duplication', () => {
    let result = getRoutesDefinitions({}, defaultPathDefinition1);
    expectToBeEqual(result, defaultPathDefinition1);

    result = getRoutesDefinitions(appConfig1, undefined);
    expectToBeEqual(result, appConfig1.routes);

    result = getRoutesDefinitions(appConfig1, defaultPathDefinition1);
    expectToBeEqual(result, resultRouteDefinition1);

    result = getRoutesDefinitions(appConfig2, defaultPathDefinition1);
    expectToBeEqual(result, resultRouteDefinition2);
  });
});
