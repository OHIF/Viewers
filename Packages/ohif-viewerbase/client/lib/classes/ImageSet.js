import { Random } from 'meteor/random';
import { OHIFError } from './OHIFError';

const OBJECT = 'object';

/**
 * This class defines an ImageSet object which will be used across the viewer. This object represents
 * a list of images that are associated by any arbitrary criteria being thus content agnostic. Besides the
 * main attributes (images and uid) it allows additional attributes to be appended to it (currently
 * indiscriminately, but this should be changed).
 */
export class ImageSet {

    constructor(images) {

        if (Array.isArray(images) !== true) {
            throw new OHIFError('ImageSet expects an array of images');
        }

        // @property "images"
        Object.defineProperty(this, 'images', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: images
        });

        // @property "uid"
        Object.defineProperty(this, 'uid', {
            enumerable: false,
            configurable: false,
            writable: false,
            value: Random.id() // Unique ID of the instance
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
