/**
 * Calculates the maximum number of digits required to display a value based on the maximum value and step size.
 * @param maxValue - The maximum value to display.
 * @param step - The step size between values.
 * @returns The maximum number of digits required to display a value.
 */
const getMaxDigits = (maxValue: number, step: number) => {
  const integerDigits = maxValue.toString().length;
  const decimalDigits = step % 1 === 0 ? 0 : step.toString().split('.')[1].length;
  return integerDigits + (decimalDigits ? decimalDigits + 1 : 0);
};

export default getMaxDigits;
