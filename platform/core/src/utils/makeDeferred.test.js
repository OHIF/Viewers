import makeDeferred from './makeDeferred';

describe('makeDeferred', () => {
  it('should provide a promise to be resolved externally', () => {
    const deferred = makeDeferred();
    setTimeout(() => void deferred.resolve('Yay!'));
    return deferred.promise.then(result => void expect(result).toBe('Yay!'));
  });
  it('should provide a promise to be rejected externally', () => {
    const deferred = makeDeferred();
    setTimeout(() => void deferred.reject('Oops...'));
    return deferred.promise.catch(error => void expect(error).toBe('Oops...'));
  });
});
