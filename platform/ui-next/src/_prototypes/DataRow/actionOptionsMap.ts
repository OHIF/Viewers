// src/_prototypes/DataRow/actionOptionsMap.ts

const actionOptionsMap: { [key: string]: string[] } = {
  Measurement: ['Rename', 'Lock', 'Delete'],
  Segmentation: ['Rename', 'Lock', 'Export', 'Delete'],
  // Add more types and their corresponding actions as needed
};

export default actionOptionsMap;
