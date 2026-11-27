/**
 * Create a random GUID, with the random values of crypto.getRandomValues
 * (available in every browser, secure context or not, and in Node).
 *
 * @return {string}
 */
const guid = () => {
  const getFourRandomValues = () => {
    return crypto.getRandomValues(new Uint16Array(1))[0].toString(16).padStart(4, '0');
  };
  return (
    getFourRandomValues() +
    getFourRandomValues() +
    '-' +
    getFourRandomValues() +
    '-' +
    getFourRandomValues() +
    '-' +
    getFourRandomValues() +
    '-' +
    getFourRandomValues() +
    getFourRandomValues() +
    getFourRandomValues()
  );
};

export default guid;
