const makeCancelable = (promise) => {
  let cancel = () => { };
  const wrappedPromise = new Promise((resolve, reject) => {
    cancel = () => {
      resolve = null;
      reject = null;
    };
    promise.then(
      val => {
        if (resolve) resolve(val);
      },
      error => {
        if (reject) reject(error);
      }
    );
  });
  wrappedPromise.cancel = cancel;
  return wrappedPromise;
}

export default makeCancelable
