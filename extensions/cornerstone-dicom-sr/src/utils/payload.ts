
import sanitize from 'sanitize-html';

export const HTML_REGEX = /<(br|basefont|hr|input|source|frame|param|area|meta|!--|col|link|option|base|img|wbr|!DOCTYPE).*?>|<(a|abbr|acronym|address|applet|article|aside|audio|b|bdi|bdo|big|blockquote|body|button|canvas|caption|center|cite|code|colgroup|command|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fieldset|figcaption|figure|font|footer|form|frameset|head|header|hgroup|h1|h2|h3|h4|h5|h6|html|i|iframe|ins|kbd|keygen|label|legend|li|map|mark|menu|meter|nav|noframes|noscript|object|ol|optgroup|output|p|pre|progress|q|rp|rt|ruby|s|samp|script|section|select|small|span|strike|strong|style|sub|summary|sup|table|tbody|td|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video).*?<\/\2>/i;
export const HTML_EXTRACTION_REGEX = /<.*>.*<\/.*>/gms;

export const enum payloadMIMEOptions {
  TEXT = "text/plain",
  HTML = "text/html",
  PDF = "application/pdf",
  DEFAULT = TEXT,
}

export type SanitizeOptions = {
  value: string,
  mime: string,
}

export function getPayloadType(payload: string, suggested_mime: string = "text/plain") {
    // PDF
    if (!payload.indexOf('%PDF-')) {
        return 'application/pdf';
    }
    // HTML.
    // Credit for validation regex goes to CSᵠ (https://stackoverflow.com/questions/15458876/check-if-a-string-is-html-or-not)
    if (HTML_REGEX.test(payload)) {
        return 'text/html';
    }
    // Passthrough mime if we cannot detect a special mime.
    return suggested_mime;
}

export function stringToBlob(data: string, mime: string=payloadMIMEOptions.DEFAULT): Blob {
  return new Blob([data], {
    type: mime,
  })
}

export function extractHTMLFromPayload(data: string): string {
  const results = HTML_EXTRACTION_REGEX.exec(data);
  if (results && results.length) {
    return results.shift();
  }
  return data;
}

export function sanitizeHTML(data: string): string {
  const html = extractHTMLFromPayload(data);
  return sanitize(
    html
  );
}

export function fromBase64(data: string): string {
    try {
        return window.atob(data);
    } catch {
        return data
    }
}