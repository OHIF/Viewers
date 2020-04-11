export default function makeDeferred() {
  let reject, resolve, promise = new Promise(function (res, rej) {
    resolve = res;
    reject = rej;
  });
  return Object.freeze({ promise, resolve, reject });
}
