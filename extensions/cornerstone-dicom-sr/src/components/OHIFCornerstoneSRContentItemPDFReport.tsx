import React from 'react';

export interface PDFViewProps {
    readonly content: Blob;
}

export function OHIFCornerstoneSRContentItemPDFReport(props: PDFViewProps): JSX.Element {
    const content = props.content;
    const fileURL = URL.createObjectURL(content);

    return (
        <object data={fileURL} width="100%" height="500rem" type="application/pdf">
            <p>Your browser doesn’t support PDFs. Please download the PDF to view it: <a href={fileURL}>Download
                PDF</a>.</p>
        </object>
    )
        ;

}