import React, { useEffect } from 'react';
import Markdown from 'marked-react';
import {
  extractHTMLFromPayload,
  fromBase64,
  getPayloadType,
  sanitizeHTML,
  payloadMIMEOptions,
} from '../utils/payload';
import { OHIFCornerstoneSRContainerItemPDFReport } from './OHIFCornerstoneSRContainerItemPDFReport';
import { useState } from 'react';

export interface ReportContentDisplayProps {
  readonly content: Blob;
}

export function OHIFCornerstoneSRContainerItemReport(
  props: ReportContentDisplayProps
): JSX.Element {
  const content = props.content;
  const [mime, setMime] = useState<string>(payloadMIMEOptions.DEFAULT);
  const [textContent, setTextContent] = useState<string>();

  useEffect(() => {
    content.text().then(data => setTextContent(data));
  })

  if (!textContent) return (<></>);

  let text_content = fromBase64(textContent);

  // Sometimes, we may receive a mime of text/plain because the originator based it on the extension of the file instead
  // of conducting a more thorough search by peaking at the contents and testing.
  // I understand that can be a very expensive operation, so we do the bare minimum mime correction we need.
  const correctMime = getPayloadType(text_content, mime);

  if (correctMime != mime) {
    setMime(correctMime);
  }

  switch (correctMime) {
    case payloadMIMEOptions.TEXT:
      return (
        <Markdown>
          {text_content}
        </Markdown>
      );
    case payloadMIMEOptions.HTML:
      text_content = extractHTMLFromPayload(text_content);
      return (
        //<div dangerouslySetInnerHTML={{ __html: sanitizeHTML(text_content) }} />
        <div dangerouslySetInnerHTML={{ __html: text_content }} />
      );
    case payloadMIMEOptions.PDF:
      return (
        <OHIFCornerstoneSRContainerItemPDFReport content={content} />
      );
    default:
      return (
        <p>
          `Document with mime ${correctMime} is not recognized or supported for display.`
        </p>
      );
  }
}
