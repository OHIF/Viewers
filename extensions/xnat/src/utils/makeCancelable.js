/**
 * makeCancelable - Wraps a promise to make it canclable.
 *                  Source: https://github.com/facebook/react/issues/5465#issuecomment-157888325
 *
 * @param  {Promise} promise The promise to wrap.
 * @returns {object}  An object containing the wrapped promise, and a cancel method.
 */
export default promise => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(val =>
      hasCanceled_ ? reject({ isCanceled: true }) : resolve(val)
    );
    promise.catch(error =>
      hasCanceled_ ? reject({ isCanceled: true }) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
};
