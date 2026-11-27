// jsdom has no TextEncoder or TextDecoder. dcmjs 1.0 makes a TextEncoder when
// its module loads, so each test that imports dcmjs needs them before the import.
const { TestEnvironment } = require('jest-environment-jsdom');
const { TextEncoder, TextDecoder } = require('util');

class JsdomWithTextEncoder extends TestEnvironment {
  constructor(config, context) {
    super(config, context);
    this.global.TextEncoder ??= TextEncoder;
    this.global.TextDecoder ??= TextDecoder;
  }
}

module.exports = JsdomWithTextEncoder;
