// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// The callback function returned is assigned a clearDebounceTimeout function
// that provides for clearing the timeout/debounced function so that it is not called.
function debounce(func, wait, immediate) {
  var timeout;
  const callback = function () {
    var context = this,
      args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) {
        func.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      func.apply(context, args);
    }
  };

  callback.clearDebounceTimeout = () => {
    clearTimeout(timeout);
    timeout = null;
  };

  return callback;
}

export default debounce;
