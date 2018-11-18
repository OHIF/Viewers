'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getTabIndex;

var _jsxAstUtils = require('jsx-ast-utils');

/**
 * Returns the tabIndex value.
 */
function getTabIndex(tabIndex) {
  // First test if we can extract a literal value
  // to see if it's a valid tabIndex. If not, then just see if
  // one exists as an expression.
  var literalTabIndex = (0, _jsxAstUtils.getLiteralPropValue)(tabIndex);
  if (literalTabIndex !== undefined || literalTabIndex !== null) {
    return isNaN(Number(literalTabIndex)) ? undefined : literalTabIndex;
  }

  return (0, _jsxAstUtils.getPropValue)(tabIndex);
}