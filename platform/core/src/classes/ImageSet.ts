import guid from '../utils/guid.js';
import calculateScanAxisNormal from '../utils/calculateScanAxisNormal';

type Attributes = Record<string, unknown>;
type Image = {
  StudyInstanceUID?: string;
  ImagePositionPatient?: string;
  ImageOrientationPatient?: string;
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

  /**
   * Default image sorting. Sorts by the following (in order of priority)
   * 1. Image position (if ImagePositionPatient and ImageOrientationPatient are defined)
   * 2. InstanceNumber
   * Note: Images are sorted in-place and a reference to the sorted image array is returned.
   *
   * @returns images - reference to images after sorting
   */
  sort(): Image[] {
    try {
      return this.sortByImagePositionPatient();
    } catch (error) {
      return this.sortByInstanceNumber();
    }
  }

  /**
   * Sort using the provided callback function.
   * Note: Images are sorted in-place and a reference to the sorted image array is returned.
   *
   * @param sortingCallback - sorting function
   * @returns images - reference to images after sorting
   */
  sortBy(sortingCallback: (a: Image, b: Image) => number): Image[] {
    return this.images.sort(sortingCallback);
  }

  /**
   * Sort by InstanceNumber
   * Note: Images are sorted in-place and a reference to the sorted image array is returned.
   *
   * @returns images - reference to images after sorting
   */
  sortByInstanceNumber(): Image[] {
    return this.sortBy((a, b) => {
      // Sort by InstanceNumber (0020,0013)
      // @ts-ignore
      return (parseInt(a.InstanceNumber) || 0) - (parseInt(b.InstanceNumber) || 0);
    });
  }

  /**
   * Sort by image position, calculated using ImageOrientationPatient and ImagePositionPatient
   * Note: Images are sorted in-place and a reference to the sorted image array is returned.
   *
   * @returns images - reference to images after sorting
   */
  sortByImagePositionPatient(): Image[] {
    const images = this.images;

    if (images.length <= 1) {
      return; // No need to sort if there's only one image
    }

    // Use the first image as a reference
    const referenceImagePositionPatient = images[0].ImagePositionPatient;
    const ImageOrientationPatient = images[0].ImageOrientationPatient;

    if (!referenceImagePositionPatient) {
      throw new Error(
        'Cannot sort ImageSet by real-world positions - ImagePositionPatient is undefined'
      );
    } else if (!ImageOrientationPatient) {
      throw new Error(
        'Cannot sort ImageSet by real-world positions - ImageOrientationPatient is undefined'
      );
    }

    // Calculate the scan axis normal using the cross product
    const scanAxisNormal = calculateScanAxisNormal(ImageOrientationPatient);

    // Compute distances from each image to the reference image
    const distanceInstancePairs = images.map(image => {
      const imagePositionPatient = image.ImagePositionPatient;
      const distance = scanAxisNormal.reduce((sum, normalComponent, index) => {
        return (
          sum +
          normalComponent * (imagePositionPatient[index] - referenceImagePositionPatient[index])
        );
      }, 0);
      return { distance, image };
    });
    // Sort images based on the computed distances
    distanceInstancePairs.sort((a, b) => b.distance - a.distance);
    // Reorder the images in the original array
    const sortedImages = distanceInstancePairs.map(pair => pair.image);

    images.sort((a, b) => sortedImages.indexOf(a) - sortedImages.indexOf(b));
    return images;
  }
}

export default ImageSet;
