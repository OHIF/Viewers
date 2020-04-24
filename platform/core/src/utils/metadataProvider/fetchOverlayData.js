import { api } from 'dicomweb-client';
import DICOMWeb from '../../DICOMWeb';
import str2ab from '../str2ab';
import unpackOverlay from './unpackOverlay';

import errorHandler from '../../errorHandler';

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

      if (instance[OverlayDataTag] && instance[OverlayDataTag].InlineBinary) {
        const inlineBinaryData = atob(instance[OverlayDataTag].InlineBinary);
        const arraybuffer = str2ab(inlineBinaryData);

        instance[OverlayDataTag] = unpackOverlay(arraybuffer);
      } else if (
        instance[OverlayDataTag] &&
        instance[OverlayDataTag].BulkDataURI
      ) {
        OverlayDataPromises.push(
          _getOverlayData(instance[OverlayDataTag], server)
        );
        OverlayDataTags.push(OverlayDataTag);
      } else if (
        instance[OverlayDataTag] &&
        instance[OverlayDataTag] instanceof ArrayBuffer
      ) {
        instance[OverlayDataTag] = unpackOverlay(instance[OverlayDataTag]);
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
    errorInterceptor: errorHandler.getHTTPErrorHandler(),
  };
  const dicomWeb = new api.DICOMwebClient(config);
  const options = {
    BulkDataURI: uri,
  };

  return dicomWeb
    .retrieveBulkData(options)
    .then(result => result[0])
    .then(unpackOverlay);
}
