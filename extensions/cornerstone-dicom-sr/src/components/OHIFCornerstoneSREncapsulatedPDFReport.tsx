import React, { useEffect, useState } from 'react';

export interface PDFViewProps {
    readonly content: Blob;
}

export function OHIFCornerstoneSREncapsulatedPDFReport(props: PDFViewProps): JSX.Element {
    const [fileURL, setFileURL] = useState<string>('');

    useEffect(() => {
      const url = URL.createObjectURL(props.content);
      setFileURL(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }, [props.content]);

    return (
        <object data={fileURL} width="100%" height="500rem" type="application/pdf">
            <p>Your browser doesn’t support PDFs. Please download the PDF to view it: <a href={fileURL}>Download
                PDF</a>.</p>
        </object>
    )
        ;

}