function isFunction(functionToCheck) {
  return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

export default function makeCancelable(thenable, thenFn, catchFn) {
  let isCanceled = false;
  const promise = Promise.resolve(thenable).then(
    function (result) {
      if (isCanceled) throw Object.freeze({ isCanceled });
      if (isFunction(thenFn)) {
        thenFn(result);
      } else {
        return result;
      }
    },
    function (error) {
      if (isCanceled) throw Object.freeze({ isCanceled, error });
      if (isFunction(catchFn)) {
        catchFn(error);
      } else {
        throw error;
      }
    }
  );
  return Object.assign(Object.create(promise), {
    then: promise.then.bind(promise),
    cancel() {
      isCanceled = true;
    },
  });
}
