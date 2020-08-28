module.exports = {
  toXy: function (pointset, format) {
    if (format === undefined) {
      return pointset.slice();
    }
    return pointset.map(function (pt) {
      /*jslint evil: true */
      const _getXY = new Function(
        'pt',
        'return [pt' + format[0] + ',' + 'pt' + format[1] + '];'
      );
      return _getXY(pt);
    });
  },

  fromXy: function (pointset, format) {
    if (format === undefined) {
      return pointset.slice();
    }
    return pointset.map(function (pt) {
      /*jslint evil: true */
      const _getObj = new Function(
        'pt',
        'const o = {}; o' +
          format[0] +
          '= pt[0]; o' +
          format[1] +
          '= pt[1]; return o;'
      );
      return _getObj(pt);
    });
  },
};
