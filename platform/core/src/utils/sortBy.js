// Return the array sorting function for its object's properties
export default function sortBy() {
  var fields = [].slice.call(arguments),
    n_fields = fields.length;

  return function (A, B) {
    var a, b, field, key, reverse, result, i;

    for (i = 0; i < n_fields; i++) {
      result = 0;
      field = fields[i];

      key = typeof field === 'string' ? field : field.name;

      a = A[key];
      b = B[key];

      if (typeof field.primer !== 'undefined') {
        a = field.primer(a);
        b = field.primer(b);
      }

      reverse = field.reverse ? -1 : 1;

      if (a < b) {
        result = reverse * -1;
      }

      if (a > b) {
        result = reverse * 1;
      }

      if (result !== 0) {
        break;
      }
    }

    return result;
  };
}
