import guid from '../utils/guid.js';
import { Vector3 } from 'cornerstone-math';

type Attributes = Record<string, unknown>;
type Image = {
  StudyInstanceUID?: string;
  getData(): {
    metadata: {
      ImagePositionPatient: number[];
      ImageOrientationPatient: number[];
    };
  };
};

/**
 * This class defines an ImageSet object which will be used across the viewer. This object represents
 * a list of images that are associated by any arbitrary criteria being thus content agnostic. Besides the
 * main attributes (images and uid) it allows additional attributes to be appended to it (currently
 * indiscriminately, but this should be changed).
 */
class ImageSet {
  images: Image[];
  uid: string;
  instances: Image[];
  instance?: Image;
  StudyInstanceUID?: string;

  constructor(images: Image[]) {
    if (!Array.isArray(images)) {
      throw new Error('ImageSet expects an array of images');
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

    this.instances = images;
    this.instance = images[0];
    this.StudyInstanceUID = this.instance?.StudyInstanceUID;
  }

  load: () => Promise<void>;

  getUID(): string {
    return this.uid;
  }

  setAttribute(attribute: string, value: unknown): void {
    this[attribute] = value;
  }

  getAttribute(attribute: string): unknown {
    return this[attribute];
  }

  setAttributes(attributes: Attributes): void {
    if (typeof attributes === 'object' && attributes !== null) {
      for (const [attribute, value] of Object.entries(attributes)) {
        this[attribute] = value;
      }
    }
  }

  getNumImages = (): number => this.images.length;

  getImage(index: number): Image {
    return this.images[index];
  }

  sortBy(sortingCallback: (a: Image, b: Image) => number): Image[] {
    return this.images.sort(sortingCallback);
  }

  sortByImagePositionPatient(): void {
    const images = this.images;
    const referenceImagePositionPatient = _getImagePositionPatient(images[0]);

    const refIppVec = new Vector3(
      referenceImagePositionPatient[0],
      referenceImagePositionPatient[1],
      referenceImagePositionPatient[2]
    );

    const ImageOrientationPatient = _getImageOrientationPatient(images[0]);

    const scanAxisNormal = new Vector3(
      ImageOrientationPatient[0],
      ImageOrientationPatient[1],
      ImageOrientationPatient[2]
    ).cross(
      new Vector3(
        ImageOrientationPatient[3],
        ImageOrientationPatient[4],
        ImageOrientationPatient[5]
      )
    );

    const distanceImagePairs = images.map(function (image: Image) {
      const ippVec = new Vector3(..._getImagePositionPatient(image));
      const positionVector = refIppVec.clone().sub(ippVec);
      const distance = positionVector.dot(scanAxisNormal);

      return {
        distance,
        image,
      };
    });

    distanceImagePairs.sort(function (a, b) {
      return b.distance - a.distance;
    });

    const sortedImages = distanceImagePairs.map(a => a.image);

    images.sort(function (a, b) {
      return sortedImages.indexOf(a) - sortedImages.indexOf(b);
    });
  }
}

function _getImagePositionPatient(image) {
  return image.getData().metadata.ImagePositionPatient;
}

function _getImageOrientationPatient(image) {
  return image.getData().metadata.ImageOrientationPatient;
}

export default ImageSet;
