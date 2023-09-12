const getMaxDigits = (maxValue: number, step: number) => {
  const integerDigits = maxValue.toString().length;
  const decimalDigits = step % 1 === 0 ? 0 : step.toString().split('.')[1].length;
  return integerDigits + (decimalDigits ? decimalDigits + 1 : 0);
};

export default getMaxDigits;
