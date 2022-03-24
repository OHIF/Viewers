import nrrd from 'nrrd-js';
import pako from 'pako';


export default function readNrrd(data) {
  const maskImageSize = {
    width: 0,
    height: 0,
    numberOfFrames: 0,
  };
  const nrrdfile = nrrd.parse(data);

  // Currently gzip is not supported in nrrd.js
  if (nrrdfile.encoding === 'gzip') {
    const buffer = pako.inflate(nrrdfile.buffer).buffer;

    nrrdfile.encoding = 'raw';
    nrrdfile.data = new Uint16Array(buffer);
    nrrdfile.buffer = buffer;
  }

  const image = nrrdfile.buffer;
  const header = nrrdfile;
  delete header.data;
  delete header.buffer;

  const dims = header.sizes;
  maskImageSize.width = dims[0];
  maskImageSize.height = dims[1];
  maskImageSize.numberOfFrames = dims[2];

  return {
    header,
    image,
    maskImageSize,
  };
}
