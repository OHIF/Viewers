
// TODO: Remove once we have dcmjs PR #455 merged in and a new version of dcmjs. A comprehensive mapping is present there.
export const emptyTagValue = '[empty]';
export const encodings = new Map<string, string>(
  [
    ['default', 'latin1'],
    ['ISO_IR 192', 'utf-8'],
    ['ISO 2022 IR 100', 'latin1'],
  ]
);

export const defaultDicomEncoding = 'ISO 2022 IR 100';
export const defaultWebEncoding = 'iso-8859-1';