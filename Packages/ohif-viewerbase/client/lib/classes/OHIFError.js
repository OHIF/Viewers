// @TODO: improve this object
/**
 * Objects to be used to throw errors, specially
 * in Trackers functions (afterFlush, Flush).
 */
export class OHIFError extends Error {

    constructor(message) {
      super();
      this.message = message; 
      this.stack = (new Error()).stack;
      this.name = this.constructor.name;
    }
}