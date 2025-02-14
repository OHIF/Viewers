const componentToHex = c => {
  let hex = c.toString(16);
  return hex.length === 1 ? '0' + hex : hex;
};

const rgbToHex = (rgbString, delimiter) => {
  let colorHex;
  try {
    const rgb = rgbString.split(delimiter).map(c => Number(c));
    colorHex = `#${componentToHex(rgb[0])}${componentToHex(rgb[1])}${componentToHex(rgb[2])}`;
  } catch (err) {
    console.error(`Error parsing color: ${rgbString}`);
    colorHex = '#000000';
  }
  return colorHex;
};

const rgbArrayToHex = rgbArray => {
  let colorHex;
  try {
    const rgb = rgbArray.map(c => Number(c));
    colorHex = `#${componentToHex(rgb[0])}${componentToHex(rgb[1])}${componentToHex(rgb[2])}`;
  } catch (err) {
    console.error(`Error parsing color: ${rgbArray}`);
    colorHex = '#000000';
  }
  return colorHex;
};

const hexToRgb = (hex) => {
  const comp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return comp
    ? {
        r: parseInt(comp[1], 16),
        g: parseInt(comp[2], 16),
        b: parseInt(comp[3], 16),
      }
    : null;
};

const colorTools = {
  rgbToHex,
  rgbArrayToHex,
  hexToRgb,
};

export default colorTools;
