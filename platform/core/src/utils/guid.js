/**
 * Create a random GUID using Web Crypto API for better randomness
 *
 * @return {string}
 */
const guid = () => {
  const getFourRandomValues = () => {
    // Generate 2 random bytes using Web Crypto API
    const array = new Uint8Array(2);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
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
