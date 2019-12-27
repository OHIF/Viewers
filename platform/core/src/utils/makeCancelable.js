const makeCancelable = (promise, thenFn, catchFn) => {
  let cancel = () => { };
  const wrappedPromise = new Promise((resolve, reject) => {
    cancel = () => {
      resolve = null;
      reject = null;
    };
    promise.then(
      val => {
        if (resolve) {
          if (thenFn) {
            thenFn(val);
          } else {
            resolve(val);
          }
        }
      },
      error => {
        if (reject) {
          if (catchFn) {
            catchFn(error);
          } else {
            reject(error);
          }
        }
      }
    );
  });
  wrappedPromise.cancel = cancel;
  return wrappedPromise;
}

export default makeCancelable
