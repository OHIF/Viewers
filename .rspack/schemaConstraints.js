// Shared, dependency-free reader for the value constraints declared in this
// repo's hand-written JSON Schemas (platform/app/pluginConfig.schema.json,
// ohif.schema.json).
//
// The build validates configuration against those schemas WITHOUT a JSON-Schema
// library — it must not gain a runtime dependency for config validation — so
// each hand-rolled validator reads its `pattern` / `minLength` keywords out of
// the schema rather than retyping them. Retyping is the drift class that
// platform/app/src/__tests__/pluginConfigSchemaParity.test.js exists to catch;
// this module is how the second validator avoids reintroducing it.
//
// Structure (which keys exist, which are required, their types) stays
// hand-rolled in each validator: that part is readable, produces better error
// messages than a generic validator would, and is covered by parity tests.

/**
 * @param {object} properties a JSON Schema `properties` object
 * @returns {Record<string, {pattern?: RegExp, minLength?: number}>} constraints
 *   keyed by field name, containing only the fields that declare one
 */
module.exports = function schemaConstraints(properties) {
  const constraints = {};
  for (const [field, spec] of Object.entries(properties || {})) {
    const constraint = {};
    if (typeof spec.pattern === 'string') {
      constraint.pattern = new RegExp(spec.pattern);
    }
    if (typeof spec.minLength === 'number') {
      constraint.minLength = spec.minLength;
    }
    if (Object.keys(constraint).length) {
      constraints[field] = constraint;
    }
  }
  return constraints;
};
