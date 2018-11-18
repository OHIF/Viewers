/* eslint-env mocha */

import assert from 'assert';
import fs from 'fs';
import path from 'path';
import plugin from '../src';

const rules = fs.readdirSync(path.resolve(__dirname, '../src/rules/'))
  .map(f => path.basename(f, '.js'));

describe('all rule files should be exported by the plugin', () => {
  rules.forEach((ruleName) => {
    it(`should export ${ruleName}`, () => {
      assert.equal(
        plugin.rules[ruleName],
        require(path.join('../src/rules', ruleName)) // eslint-disable-line
      );
    });
  });
});

describe('configurations', () => {
  it('should export a \'recommended\' configuration', () => {
    assert(plugin.configs.recommended);
  });
});
