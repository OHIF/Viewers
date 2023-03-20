/** Splits a list of stirngs by commas within the strings */
const splitComma = (strings: string[]): string[] => {
  for (let i = 0; i < strings.length; i++) {
    const comma = strings[i].indexOf(',');
    if (comma !== -1) {
      const splits = strings[i].split(/,/);
      strings.splice(i, 1, ...splits);
    }
  }
  return strings;
};

export default splitComma;
