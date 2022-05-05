const getSequenceAsArray = sequence =>
  Array.isArray(sequence) ? sequence : [sequence];

export default getSequenceAsArray;
