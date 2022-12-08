import { client } from '../../appExtensions/LungModuleSimilarityPanel/utils';
import { radcadapi } from '../../utils/constants';

let pako = require('pako');
window.Buffer = window.Buffer || require('buffer').Buffer;

export class _3DSegmentationApiClass {
  static email = 'nick.fragakis@thetatech.ai';

  static get3DSegmentationData = async config => {
    var requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    const state = window.store.getState();
    let response = await fetch(
      // `${radcadapi}/morphology?email=${state.oidc.user.email}&series=${config.series_uid}&label=${config.label}`,
      `${radcadapi}/morphology?email=${this.email}&series=${config.series_uid}&label=${config.label}`,
      requestOptions
    );

    response = await response.json();
    return response;
    // const url = `/morphology?email=${this.email}&series=${config.series_uid}&label=${config.label}`;
    // const data = await client.get(url);
    // return data.data;
  };

  static decompressSegmentation(segmentation) {
    return JSON.parse(
      pako.inflate(Buffer.from(segmentation, 'base64'), { to: 'string' })
    );
  }

  static get3DLabels = async series_uid => {
    const state = window.store.getState();

    var requestOptions = {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    };

    let response = await fetch(
      // `${radcadapi}/segmentations?series=${series_uid}&email=${state.oidc.user.email}`,
      `${radcadapi}/segmentations?series=${series_uid}&email=${this.email}`,
      requestOptions
    );
    const segmentations = await response.json();

    // const response = await client.get(
    //   `/segmentations?series=${series_uid}&email=${this.email}`
    // );

    // const segmentations = response.data;
    const segmentationLabels = Object.keys(segmentations || {});
    return segmentationLabels;
  };
}
