/**
 * DeferredPromise class for XNAT extension.
 * This ensures promises returned from XNAT data source work with the OHIF viewer's route initialization.
 * The defaultRouteInit function expects promises with a 'start()' method.
 */
export class DeferredPromise {
  metadata = undefined;
  processFunction = undefined;
  internalPromise = undefined;
  thenFunction = undefined;
  rejectFunction = undefined;

  constructor(processFunction: () => Promise<any>, metadata?: any) {
    this.processFunction = processFunction;
    this.metadata = metadata;
  }

  setMetadata(metadata) {
    this.metadata = metadata;
  }
  
  setProcessFunction(func) {
    this.processFunction = func;
  }
  
  getPromise() {
    return this.start();
  }
  
  start() {
    if (this.internalPromise) {
      return this.internalPromise;
    }
    this.internalPromise = this.processFunction();
    // in case then and reject functions called before start
    if (this.thenFunction) {
      this.then(this.thenFunction);
      this.thenFunction = undefined;
    }
    if (this.rejectFunction) {
      this.reject(this.rejectFunction);
      this.rejectFunction = undefined;
    }
    return this.internalPromise;
  }
  
  then(func) {
    if (this.internalPromise) {
      return this.internalPromise.then(func);
    } else {
      this.thenFunction = func;
    }
  }
  
  reject(func) {
    if (this.internalPromise) {
      return this.internalPromise.reject(func);
    } else {
      this.rejectFunction = func;
    }
  }
}

/**
 * Helper function to wrap a standard Promise with the DeferredPromise interface
 * @param promise A standard Promise or promise-returning function
 * @param metadata Optional metadata to associate with the promise
 * @returns A DeferredPromise that has a start() method
 */
export function wrapWithDeferredPromise(promise: Promise<any> | (() => Promise<any>), metadata?: any) {
  // If it's already a DeferredPromise, return it
  if (promise && typeof (promise as any).start === 'function') {
    return promise;
  }
  
  // If it's a function that returns a promise, use it as the process function
  if (typeof promise === 'function') {
    return new DeferredPromise(promise, metadata);
  }
  
  // If it's a standard promise, wrap it in a function
  return new DeferredPromise(() => promise, metadata);
}

/**
 * Wrap an array of promises or promise-returning functions with DeferredPromise
 * @param promises Array of promises or promise-returning functions
 * @returns Array of DeferredPromises
 */
export function wrapArrayWithDeferredPromises(promises: Array<any>) {
  if (!Array.isArray(promises)) {
    return [];
  }
  
  return promises.map(p => wrapWithDeferredPromise(p));
}

export default {
  DeferredPromise,
  wrapWithDeferredPromise,
  wrapArrayWithDeferredPromises
}; 