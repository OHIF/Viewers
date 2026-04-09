import React, { useEffect } from 'react';
import {
  fromBase64,
  getPayloadType,
  sanitizeHtml,
    toUTF8,
} from '../utils/payload';
import {utils} from "@ohif/core";
import { OHIFCornerstoneSREncapsulatedPDFReport } from './OHIFCornerstoneSREncapsulatedPDFReport';
import { useState } from 'react';
import OHIFLazyMarkdownComponent from './OHIFLazyMarkdown';
import LoadingSpinner from "@ohif/ui-next/components/Icons/Sources/LoadingSpinner";

export interface ReportContentDisplayProps {
  readonly content: Blob;
  readonly encoding: string,
  readonly expectB64: boolean;
}

export function OHIFCornerstoneSREncapsulatedReport(
  props: ReportContentDisplayProps
): JSX.Element {
  const [data, setData] = useState<Blob>(props.content);
  const [mime, setMime] = useState<string>(utils.MimeOptions.Default);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    data.text().then(
      (content) => {
        const decoded = props.expectB64 ? fromBase64(content) : content;
        // Sometimes, we may receive a mime of text/plain because the originator based it on the extension of the file instead
        // of conducting a more thorough search by peaking at the contents and testing.
        // I understand that can be a very expensive operation, so we do the bare minimum mime correction we need.
        const correctMime = getPayloadType(decoded, mime);
        const utf8Text = toUTF8(decoded, props.encoding);

        setTextContent(utf8Text);
        setData(utils.toBlob(decoded, correctMime));
        setMime(correctMime);
      },
    );
  }, [props.content, props.expectB64, props.encoding]);

    if (textContent === null) {
        return (<LoadingSpinner />);
    }

  switch (mime) {
    case utils.MimeOptions.Text:
      return (
          <blockquote>
            <OHIFLazyMarkdownComponent markdownContent={textContent} />
          </blockquote>
      );
    case utils.MimeOptions.Html:
      return (
        <blockquote className="invert [&_img]:invert">
          <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(textContent) }} />
        </blockquote>
      );
    case utils.MimeOptions.Pdf:
      return (
        <blockquote>
          <OHIFCornerstoneSREncapsulatedPDFReport content={data} />
        </blockquote>
      );
    default:
      return (
        <p>
          {`Document with mime ${mime} is not recognized or supported for display. Please, report issue and/or contribute an update to the project.`}
        </p>
      );
  }
}
