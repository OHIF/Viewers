export function intensityToRange(value, SF) {
  if (Array.isArray(value)) {
    const valueArray = [];
    for (let i = 0; i < value.length; i++) {
      valueArray.push(parseInt((value[i] * SF).toFixed(0)));
    }
    return valueArray;
  }

  return parseInt((value * SF).toFixed(0));
}

export function rangeToIntensity(value, SF) {
  if (Array.isArray(value)) {
    const valueArray = [];
    for (let i = 0; i < value.length; i++) {
      valueArray.push(value[i] / SF);
    }
    return valueArray;
  }

  return value / SF;
}

export function opacityToRange(value) {
  if (Array.isArray(value)) {
    const valueArray = [];
    for (let i = 0; i < value.length; i++) {
      valueArray.push(parseInt((value[i] * 100).toFixed(0)));
    }
    return valueArray;
  }

  return parseInt((value * 100).toFixed(0));
}

export function rangeToOpacity(value) {
  if (Array.isArray(value)) {
    const valueArray = [];
    for (let i = 0; i < value.length; i++) {
      valueArray.push(parseFloat(value[i]) / 100);
    }
    return valueArray;
  }

  return parseFloat(value) / 100;
}

export function nFormatter(num, digits) {
  const lookup = [
    { value: 1, symbol: '' },
    { value: 1e3, symbol: 'k' },
    { value: 1e6, symbol: 'M' },
    { value: 1e9, symbol: 'G' },
    { value: 1e12, symbol: 'T' },
    { value: 1e15, symbol: 'P' },
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find(function(item) {
      return Math.abs(num) >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, '$1') + item.symbol
    : '0';
}
