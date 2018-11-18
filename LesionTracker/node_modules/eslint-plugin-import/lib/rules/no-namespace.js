'use strict';

/**
 * @fileoverview Rule to disallow namespace import
 * @author Radek Benkel
 */

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------


module.exports = function (context) {
  return {
    'ImportNamespaceSpecifier': function ImportNamespaceSpecifier(node) {
      context.report(node, 'Unexpected namespace import.');
    }
  };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJ1bGVzL25vLW5hbWVzcGFjZS5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwiY29udGV4dCIsIm5vZGUiLCJyZXBvcnQiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7O0FBS0E7QUFDQTtBQUNBOzs7QUFHQUEsT0FBT0MsT0FBUCxHQUFpQixVQUFVQyxPQUFWLEVBQW1CO0FBQ2xDLFNBQU87QUFDTCxnQ0FBNEIsa0NBQVVDLElBQVYsRUFBZ0I7QUFDMUNELGNBQVFFLE1BQVIsQ0FBZUQsSUFBZjtBQUNEO0FBSEksR0FBUDtBQUtELENBTkQiLCJmaWxlIjoicnVsZXMvbm8tbmFtZXNwYWNlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAZmlsZW92ZXJ2aWV3IFJ1bGUgdG8gZGlzYWxsb3cgbmFtZXNwYWNlIGltcG9ydFxuICogQGF1dGhvciBSYWRlayBCZW5rZWxcbiAqL1xuXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUnVsZSBEZWZpbml0aW9uXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgcmV0dXJuIHtcbiAgICAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUsIGBVbmV4cGVjdGVkIG5hbWVzcGFjZSBpbXBvcnQuYClcbiAgICB9LFxuICB9XG59XG4iXX0=