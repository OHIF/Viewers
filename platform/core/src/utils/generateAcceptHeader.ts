const generateAcceptHeader = (
  configAcceptHeader = [],
  requestTransferSyntaxUID = '*', //default to accept all transfer syntax
  omitQuotationForMultipartRequest = false
): string[] => {
  //if acceptedHeader is passed by config use it as it.
  if (configAcceptHeader.length > 0) {
    return configAcceptHeader;
  }

  let acceptHeader = ['multipart/related'];
  let hasTransferSyntax = false;
  if (requestTransferSyntaxUID && typeForTS[requestTransferSyntaxUID]) {
    const type = typeForTS[requestTransferSyntaxUID];
    acceptHeader.push('type=' + type);
    acceptHeader.push('transfer-syntax=' + requestTransferSyntaxUID);
    hasTransferSyntax = true;
  } else {
    acceptHeader.push('type=application/octet-stream');
  }

  if (!hasTransferSyntax) {
    acceptHeader.push('transfer-syntax=*');
  }

  if (!omitQuotationForMultipartRequest) {
    //need to add quotation for each mime type of each accept entry
    acceptHeader = acceptHeader.map(mime => {
      if (mime.startsWith('type=')) {
        const quotedParam = 'type="' + mime.substring(5, mime.length) + '"';
        return quotedParam;
      }
      if (mime.startsWith('transfer-syntax=')) {
        const quotedParam = 'transfer-syntax="' + mime.substring(16, mime.length) + '"';
        return quotedParam;
      } else {
        return mime;
      }
    });
  }

  return [acceptHeader.join('; ')];
};

const typeForTS = {
  '*': 'application/octet-stream',
  '1.2.840.10008.1.2.1': 'application/octet-stream',
  '1.2.840.10008.1.2': 'application/octet-stream',
  '1.2.840.10008.1.2.2': 'application/octet-stream',
  '1.2.840.10008.1.2.4.70': 'image/jpeg',
  '1.2.840.10008.1.2.4.50': 'image/jpeg',
  '1.2.840.10008.1.2.4.51': 'image/dicom+jpeg',
  '1.2.840.10008.1.2.4.57': 'image/jpeg',
  '1.2.840.10008.1.2.5': 'image/dicom-rle',
  '1.2.840.10008.1.2.4.80': 'image/jls',
  '1.2.840.10008.1.2.4.81': 'image/jls',
  '1.2.840.10008.1.2.4.90': 'image/jp2',
  '1.2.840.10008.1.2.4.91': 'image/jp2',
  '1.2.840.10008.1.2.4.92': 'image/jpx',
  '1.2.840.10008.1.2.4.93': 'image/jpx',
};

export default generateAcceptHeader;
