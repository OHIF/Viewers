// Matches each number in a path `d` attribute, including negative, decimal, and exponent forms.
const SVG_PATH_NUMBER_PATTERN = /-?\d*\.?\d+(?:e[-+]?\d+)?/gi;

/**
 * Counts the vertices in an SVG path `d` attribute by counting its coordinate
 * pairs. Assumes absolute M/L/Z commands, which is how contour outlines render.
 */
const countSvgPathPoints = (d: string): number => {
  const numbers = d.match(SVG_PATH_NUMBER_PATTERN) ?? [];
  return Math.floor(numbers.length / 2);
};

export { countSvgPathPoints };
