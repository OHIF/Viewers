// @TODO: improve this object
/**
 * Objects to be used to throw errors
 */
class OHIFError extends Error {
  constructor(message) {
    super();
    this.message = message;
    this.stack = new Error().stack;
    this.name = this.constructor.name;
  }
}

export default OHIFError;
