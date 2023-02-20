import { client } from '../../appExtensions/LungModuleSimilarityPanel/utils';
import { radcadapi } from '../../utils/constants';

import pako from 'pako';
import { Buffer } from 'buffer';

window.Buffer = window.Buffer || require('buffer').Buffer;

const email = 'nick.fragakis@thetatech.ai';

export class _3DSegmentationApiClass {
  static async get3DSegmentationData(config) {
    const url = `${radcadapi}/morphology?email=${email}&series=${config.series_uid}&label=${config.label}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    return data;
  }

  static decompressSegmentation(segmentation) {
    return JSON.parse(
      pako.inflate(Buffer.from(segmentation, 'base64'), { to: 'string' })
    );
  }

  static async get3DLabels(series_uid) {
    const url = `${radcadapi}/segmentations?series=${series_uid}&email=${email}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const segmentations = await response.json();
    const segmentationLabels = Object.keys(segmentations || {});
    return segmentationLabels;
  }
}
