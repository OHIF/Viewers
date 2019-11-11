import guid from '../utils/guid.js';
import OHIFError from './OHIFError';
import { Vector3 } from 'cornerstone-math';

const OBJECT = 'object';

/**
 * This class defines an ImageSet object which will be used across the viewer. This object represents
 * a list of images that are associated by any arbitrary criteria being thus content agnostic. Besides the
 * main attributes (images and uid) it allows additional attributes to be appended to it (currently
 * indiscriminately, but this should be changed).
 */
class ImageSet {
  constructor(images) {
    if (Array.isArray(images) !== true) {
      throw new OHIFError('ImageSet expects an array of images');
    }

    // @property "images"
    Object.defineProperty(this, 'images', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: images,
    });

    // @property "uid"
    Object.defineProperty(this, 'uid', {
      enumerable: false,
      configurable: false,
      writable: false,
      value: guid(), // Unique ID of the instance
    });
  }

  getUID() {
    return this.uid;
  }

  setAttribute(attribute, value) {
    this[attribute] = value;
  }

  getAttribute(attribute) {
    return this[attribute];
  }

  setAttributes(attributes) {
    if (typeof attributes === OBJECT && attributes !== null) {
      const imageSet = this,
        hasOwn = Object.prototype.hasOwnProperty;
      for (let attribute in attributes) {
        if (hasOwn.call(attributes, attribute)) {
          imageSet[attribute] = attributes[attribute];
        }
      }
    }
  }

  getImage(index) {
    return this.images[index];
  }

  sortBy(sortingCallback) {
    return this.images.sort(sortingCallback);
  }

  sortByImagePositionPatient() {
    const images = this.images;
    const referenceImagePositionPatient = _getImagePositionPatient(images[0]);

    const refIppVec = new Vector3(
      referenceImagePositionPatient[0],
      referenceImagePositionPatient[1],
      referenceImagePositionPatient[2]
    );

    const imageOrientationPatient = _getImageOrientationPatient(images[0]);

    const scanAxisNormal = new Vector3(
      imageOrientationPatient[0],
      imageOrientationPatient[1],
      imageOrientationPatient[2]
    ).cross(
      new Vector3(
        imageOrientationPatient[3],
        imageOrientationPatient[4],
        imageOrientationPatient[5]
      )
    );

    const distanceImagePairs = images.map(function(image) {
      const ippVec = new Vector3(..._getImagePositionPatient(image));
      const positionVector = refIppVec.clone().sub(ippVec);
      const distance = positionVector.dot(scanAxisNormal);

      return {
        distance,
        image,
      };
    });

    distanceImagePairs.sort(function(a, b) {
      return b.distance - a.distance;
    });

    const sortedImages = distanceImagePairs.map(a => a.image);

    images.sort(function(a, b) {
      return sortedImages.indexOf(a) - sortedImages.indexOf(b);
    });
  }
}

function _getImagePositionPatient(image) {
  return image
    .getTagValue('x00200032')
    .split('\\')
    .map(Number);
}

function _getImageOrientationPatient(image) {
  return image
    .getTagValue('x00200037')
    .split('\\')
    .map(Number);
}

export default ImageSet;
