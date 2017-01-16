import { Random } from 'meteor/random';

/**
 * This class defines an ImageSet object which will be used across the viewer. This object represents
 * a list of images that are associated by any arbitrary criteria being thus content agnostic. Besides the
 * main attributes (images and uid) it allows additional attributes to be appended to it (currently
 * indiscriminately, but this should be changed).
 */
export class ImageSet {

    constructor(images) {

        if (Array.isArray(images) !== true) {
            throw new TypeError('ImageSet expects an array of images...');
        }

        // Main ImageSet attributes
        this.images = images; // Array of images
        this.uid = Random.id(); // Unique ID of the instance

    }

    setAttribute(attribute, value) {
        this[attribute] = value;
    }

    getAttribute(attribute) {
        return this[attribute];
    }

    setAttributes(attributes) {
        if (typeof attributes === 'object' && attributes !== null) {
            const imageSet = this, hasOwn = Object.prototype.hasOwnProperty;
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

}
