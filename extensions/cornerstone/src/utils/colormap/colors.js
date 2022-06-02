// https://www.slicer.org/w/index.php/Slicer3:2010_GenericAnatomyColors#Lookup_table
const colors = [
  {
    integerLabel: 0,
    textLabel: 'background',
    color: [0, 0, 0, 0],
  },
  {
    integerLabel: 1,
    textLabel: 'tissue',
    // color: [255, 174, 128, 255],
    color: [255, 0, 0, 255],
  },
  {
    integerLabel: 2,
    textLabel: 'bone',
    // color: [241, 214, 145, 255],
    color: [0, 255, 0, 255],
  },
  {
    integerLabel: 3,
    textLabel: 'skin',
    // color: [177, 122, 101, 255],
    color: [0, 0, 255, 255],
  },
  // ....
];

export default colors;
