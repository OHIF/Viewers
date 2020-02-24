/**
 * Get definitions to be used.
 * Result will contain everything from defaultRoutesDefinitions combined what is appConfig.routes.
 * Routes definition from appConfig has higher precedence
 * @param {object} appConfig app configuration containing routes (RoutesDefinitions)
 * @param {RoutesDefinitions} defaultRoutesDefinitions
 * @return {RoutesDefinitions}
 */
function getRoutesDefinitions(appConfig, defaultRoutesDefinitions) {
  return _mergeRoutesDefinitions(defaultRoutesDefinitions, appConfig.routes);
}

/**
 * Join definitions. Definitions on definitionsB has higher precedence.
 * It will return RoutesDefinitions which it is on second param combined to what is on first param (except if there is already on second param)
 *
 * @param {RoutesDefinitions} definitionsA
 * @param {RoutesDefinitions} definitionsB
 * @return {RoutesDefinitions} joint of params.
 *
 */
function _mergeRoutesDefinitions(definitionsA = [], definitionsB = []) {
  const result = [...definitionsB];
  const existingTemplate = [];

  definitionsB.forEach(definition => {
    existingTemplate[definition.name] = true;
  });

  definitionsA.forEach(definition => {
    if (!existingTemplate[definition.name]) {
      result.push(definition);
    }
  });

  return result;
}

export default getRoutesDefinitions;
