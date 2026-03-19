
/**
 * Enum of MIMEs currently supported for document payloads.
 */
export const MimeOptions = {
    AcceptJpeg: 'accept=image/jpeg',
    AcceptMp4: 'accept=video/mp4',
    Csv: `text/csv;charset=utf-8;`,
    Dicom: 'application/dicom',
    Html: 'text/html',
    Jpeg: 'image/jpeg',
    Json: 'application/json',
    Mp4: 'video/mp4',
    Pdf: 'application/pdf',
    Raw: '',
    Text: 'text/plain',
    Default: 'text/plain',
}

export type BasicBlobInputType = string | Buffer | ArrayBuffer | Uint8Array;
/**
 * Type expected as inputs to turn into a Blob.
 */
export type BlobInputType = BasicBlobInputType | Array<BasicBlobInputType>;

/**
 * Given a payload, encapsulate it into a Blob object.
 * This is used mostly to interface with components expecting blobs from different sources.
 *
 * @param {BlobInputType} data
 * @param {string} mime MIME to add to Blob so other components can know how to handle contents.
 * @return Blob
 */
export function toBlob(data: BlobInputType, mime: string = MimeOptions.Default): Blob {
    const dataArray = Array.isArray(data) ? data : [data];
    return new Blob(dataArray, {
        type: mime,
    });
}

/**
 * Enabled JPEG images downloading on IE11.
 *
 * @param {string} b64Data
 * @param {string} contentType MIME to add to Blob so other components can know how to handle contents.
 * @param {number} sliceSize MIME to add to Blob so other components can know how to handle contents.
 * @return Blob
 */
export function b64ToBlob(b64Data: string, contentType: string = MimeOptions.Raw, sliceSize: number = 512): Blob {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    return toBlob(byteArrays, contentType);
}

export function csvToBlob(csvString: string): Blob {
    return toBlob(csvString, MimeOptions.Csv)
}
