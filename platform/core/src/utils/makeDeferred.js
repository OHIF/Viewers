export default function makeDeferred() {
  let resolve, reject;
  let promise = new Promise(function(res, rej) {
    resolve = res;
    reject = rej;
  });
  return Object.freeze({
    promise,
    resolve,
    reject,
  });
}
