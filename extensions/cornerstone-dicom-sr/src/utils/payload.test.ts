import {HTML_REGEX} from './payload';
import { getPayloadType, extractHTMLFromPayload, sanitizeHtml } from './payload';
import { utils } from '@ohif/core';

const pdfFragment =
  '%PDF-1.4\n' +
  '%äüöß\n' +
  '2 0 obj\n' +
  '<</Length 3 0 R/Filter/FlateDecode>>\n' +
  'stream\n' +
  'x<9C>-<8D>M\n' +
  '^B1^L<85><F7>9<C5>[<BB>Ȥ<99><B4><9D><82><B8>^P^U\\^V\n' +
  '^^<C0>?^Pf<C4><D9>x}<DB>"<E1>%!y_"<AC><86>/} =<D6>\'<ED>^K<F9><C0><C9>#<AA><B1>C<B9>a898Eylŉ<CA>(&<FE><9F>CU<94><A9>\n' +
  '<F6>qW^t,<94><EB><AD><CA>^GK0<8D>l<AD><A6><89>CJ<D0>Ix<C4>z<A7><CB>^FK<B5><F5>y^?<DB>6ڰ<D8>!<EF>q<9D>i8φ<C3>ESC<99>2~e<E6>"<DC>\n' +
  'endstream\n' +
  'endobj\n' +
  '\n' +
  '3 0 obj\n' +
  '135\n' +
  'endobj\n' +
  '\n' +
  '4 0 obj\n' +
  '<</Type/XObject/Subtype/Image/Width 790/Height 444/BitsPerComponent 8/Length 5 0 R\n' +
  '/Filter/FlateDecode/ColorSpace/DeviceRGB\n' +
  '>>\n' +
  'stream\n';
const shiftedPDFFragment =
  '^B1^L<85><F7>9<C5>[<BB>Ȥ<99><B4><9D><82><B8>^P^U\\^V\n' +
  '%PDF-1.4\n' +
  '%äüöß\n' +
  '2 0 obj\n' +
  '<</Length 3 0 R/Filter/FlateDecode>>\n' +
  'stream\n' +
  'x<9C>-<8D>M\n' +
  '^B1^L<85><F7>9<C5>[<BB>Ȥ<99><B4><9D><82><B8>^P^U\\^V\n' +
  '^^<C0>?^Pf<C4><D9>x}<DB>"<E1>%!y_"<AC><86>/} =<D6>\'<ED>^K<F9><C0><C9>#<AA><B1>C<B9>a898Eylŉ<CA>(&<FE><9F>CU<94><A9>\n' +
  '<F6>qW^t,<94><EB><AD><CA>^GK0<8D>l<AD><A6><89>CJ<D0>Ix<C4>z<A7><CB>^FK<B5><F5>y^?<DB>6ڰ<D8>!<EF>q<9D>i8φ<C3>ESC<99>2~e<E6>"<DC>\n' +
  'endstream\n' +
  'endobj\n' +
  '\n' +
  '3 0 obj\n' +
  '135\n' +
  'endobj\n' +
  '\n' +
  '4 0 obj\n' +
  '<</Type/XObject/Subtype/Image/Width 790/Height 444/BitsPerComponent 8/Length 5 0 R\n' +
  '/Filter/FlateDecode/ColorSpace/DeviceRGB\n' +
  '>>\n' +
  'stream\n';

//TODO: fix spacing issue within tags in sanitizeHTML dependency (external package) and then update this test.
const payloads = [
  { inputPayload: 'faklsjdflk;ajsd;flkja', extractedHtml: "", sanitizedHtml: "", expectedMime: utils.MimeOptions.Text, isHtml: false },
  { inputPayload: "<html>", extractedHtml: "", sanitizedHtml: "", expectedMime: utils.MimeOptions.Text, isHtml: false },
  { inputPayload: "<html><head></head><body></body>", extractedHtml: "<html><head></head><body></body>", sanitizedHtml: "<html><head></head><body></body></html>", expectedMime: utils.MimeOptions.Html, isHtml: true },
  { inputPayload: "<  html><head></head><body></body>", extractedHtml: "<  html><head></head><body></body>", sanitizedHtml: "&lt;  html&gt;<head></head><body></body>", expectedMime: utils.MimeOptions.Html, isHtml: true },
  { inputPayload: "<html><head></head><  body></body>", extractedHtml: "<html><head></head><  body></body>", sanitizedHtml: "<html><head></head>&lt;  body&gt;</html>", expectedMime: utils.MimeOptions.Html, isHtml: true },
  { inputPayload: "<html>sadf</html>", extractedHtml: "<html>sadf</html>", sanitizedHtml: "<html>sadf</html>", expectedMime: utils.MimeOptions.Html, isHtml: true },
  { inputPayload: "<p>ssadfasdfas</p>", extractedHtml: "<p>ssadfasdfas</p>", sanitizedHtml: "<p>ssadfasdfas</p>", expectedMime: utils.MimeOptions.Html, isHtml: true },
  { inputPayload: pdfFragment, extractedHtml: "", sanitizedHtml: "", expectedMime: utils.MimeOptions.Pdf, isHtml: false },
  { inputPayload: shiftedPDFFragment, extractedHtml: "", sanitizedHtml: "", expectedMime: utils.MimeOptions.Pdf, isHtml: false },
];

describe('payloadRegex', () => {
  test('should be able to detect that the string fragment is an html payload', () => {
    payloads.forEach(payload => {
      const { inputPayload, isHtml } = payload;
        const mime = HTML_REGEX.test(inputPayload);
        expect(mime).toEqual(isHtml);
    });
  });
  test('should be able to detect that the string fragment correct mime', () => {
    payloads.forEach(payload => {
      const { inputPayload, expectedMime } = payload;
      const mime = getPayloadType(inputPayload);
      expect(mime).toEqual(expectedMime);
    });
  });
  test('should be able to extract html if input is well-formed', () => {
    payloads.forEach(payload => {
      const { inputPayload, extractedHtml } = payload;
      const htmlExtractor = HTML_REGEX.exec(inputPayload);
      try {
        const html = htmlExtractor.shift();
        expect(html).toEqual(extractedHtml);
      } catch {
        expect(htmlExtractor).toEqual(null);
      }
    });
  });
  test('should be able to extract HTML payload if any or default to empty', () => {
    payloads.forEach(payload => {
      const { inputPayload, extractedHtml } = payload;
      const resultHtml = extractHTMLFromPayload(inputPayload);
      expect(resultHtml).toEqual(extractedHtml);
    });
  });
});

describe('sanitizeHtml', () => {
  test('should be able to sanitize HTML fragments.', () => {
    payloads.forEach(payload => {
      const { inputPayload, sanitizedHtml } = payload;
      const html = sanitizeHtml(inputPayload);
      expect(html).toEqual(sanitizedHtml);
    });
  });
});
