import React, { useEffect } from 'react';
import Markdown from 'marked-react';
import {
  extractHTMLFromPayload,
  fromBase64,
  getPayloadType,
  sanitizeHTML,
  payloadMIMEOptions,
} from '../utils/payload';
import { OHIFCornerstoneSREncapsulatedPDFReport } from './OHIFCornerstoneSREncapsulatedPDFReport';
import { useState } from 'react';

export interface ReportContentDisplayProps {
  readonly content: Blob;
  readonly expectB64: boolean;
}

export function OHIFCornerstoneSREncapsulatedReport(
  props: ReportContentDisplayProps
): JSX.Element {
  const data = props.content;
  const [mime, setMime] = useState<string>(payloadMIMEOptions.DEFAULT);
  const [textContent, setTextContent] = useState<string>();

  useEffect(() => {
    data.text().then(content => {
      const decoded = props.expectB64 ? fromBase64(content) : content;
      // Sometimes, we may receive a mime of text/plain because the originator based it on the extension of the file instead
      // of conducting a more thorough search by peaking at the contents and testing.
      // I understand that can be a very expensive operation, so we do the bare minimum mime correction we need.
      const correctMime = getPayloadType(decoded, mime);
      setTextContent(decoded);
      setMime(correctMime);
    });
  })

  switch (mime) {
    case payloadMIMEOptions.TEXT:
      return (
        <Markdown>
          {textContent}
        </Markdown>
      );
    case payloadMIMEOptions.HTML:
      const htmlContent = extractHTMLFromPayload(textContent);
      return (
        //<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(text_content) }} />
        <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      );
    case payloadMIMEOptions.PDF:
      return (
        <OHIFCornerstoneSREncapsulatedPDFReport content={data} />
      );
    default:
      return (
        <p>
          `Document with mime ${mime} is not recognized or supported for display.`
        </p>
      );
  }
}
