import { client } from '../../appExtensions/LungModuleSimilarityPanel/utils';

let pako = require('pako');
window.Buffer = window.Buffer || require('buffer').Buffer;

export class _3DSegmentationApiClass {
  static email = 'nick.fragakis@thetatech.ai';

  static get3DSegmentationData = async config => {
    const url = `/morphology?email=${this.email}&series=${config.series_uid}&label=${config.label}`;
    const data = await client.get(url);
    return data.data;
  };

  static decompressSegmentation(segmentation) {
    return JSON.parse(
      pako.inflate(Buffer.from(segmentation, 'base64'), { to: 'string' })
    );
  }

  static get3DLabels = async series_uid => {
    const response = await client.get(
      `/segmentations?series=${series_uid}&email=${this.email}`
    );
    const segmentations = response.data;
    const segmentationLabels = Object.keys(segmentations || {});
    return segmentationLabels;
  };
}
