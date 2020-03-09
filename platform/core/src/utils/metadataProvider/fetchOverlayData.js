import { api } from 'dicomweb-client';
import DICOMWeb from '../../DICOMWeb';

export default async function fetchOverlayData(instance, server) {
  const OverlayDataPromises = [];
  const OverlayDataTags = [];

  return new Promise((resolve, reject) => {
    for (let overlayGroup = 0x00; overlayGroup <= 0x1e; overlayGroup += 0x02) {
      let groupStr = `60${overlayGroup.toString(16)}`;

      if (groupStr.length === 3) {
        groupStr = `600${overlayGroup.toString(16)}`;
      }

      const OverlayDataTag = `${groupStr}3000`;

      if (instance[OverlayDataTag] && instance[OverlayDataTag].BulkDataURI) {
        OverlayDataPromises.push(
          _getOverlayData(instance[OverlayDataTag], server)
        );
        OverlayDataTags.push(OverlayDataTag);
      }
    }

    if (OverlayDataPromises.length) {
      Promise.all(OverlayDataPromises).then(results => {
        for (let i = 0; i < results.length; i++) {
          instance[OverlayDataTags[i]] = results[i];
        }

        resolve();
      });
    } else {
      resolve();
    }
  });
}

async function _getOverlayData(tag, server) {
  const { BulkDataURI } = tag;

  let uri = BulkDataURI;

  // TODO: Workaround for dcm4chee behind SSL-terminating proxy returning
  // incorrect bulk data URIs
  if (server.wadoRoot.indexOf('https') === 0 && !uri.includes('https')) {
    uri = uri.replace('http', 'https');
  }

  const config = {
    url: server.wadoRoot, //BulkDataURI is absolute, so this isn't used
    headers: DICOMWeb.getAuthorizationHeader(server),
  };
  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    BulkDataURI: uri,
  };

  return dicomWeb
    .retrieveBulkData(options)
    .then(result => result[0])
    .then(_unpackOverlay);
}

function _unpackOverlay(arrayBuffer) {
  const bitArray = new Uint8Array(arrayBuffer);
  const byteArray = new Uint8Array(8 * bitArray.length);

  for (let byteIndex = 0; byteIndex < byteArray.length; byteIndex++) {
    const bitIndex = byteIndex % 8;
    const bitByteIndex = Math.floor(byteIndex / 8);
    byteArray[byteIndex] =
      1 * ((bitArray[bitByteIndex] & (1 << bitIndex)) >> bitIndex);
  }

  return byteArray;
}
