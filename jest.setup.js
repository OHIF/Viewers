// jsdom has no TextEncoder or TextDecoder. dcmjs 1.0 makes a TextEncoder when
// its module loads, so each test that imports dcmjs needs them before the import.
const { TextEncoder, TextDecoder } = require('util');

if (typeof globalThis.TextEncoder === 'undefined') {
  globalThis.TextEncoder = TextEncoder;
}
if (typeof globalThis.TextDecoder === 'undefined') {
  globalThis.TextDecoder = TextDecoder;
}
