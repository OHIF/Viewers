const labels = [
  'Parenchyma left (entire kidney)',
  'Parenchyma left (upper pole)',
  'Parenchyma left (lower pole)',
  'Collecting system left (entire kidney)',
  'Collecting system left (upper pole)',
  'Collecting system left (lower pole)',
  'Ureter left (upper pole)',
  'Ureter left (lower pole)',
  'Parenchyma right (entire kidney)',
  'Parenchyma right (upper pole)',
  'Parenchyma right (lower pole)',
  'Collecting system right (entire kidney)',
  'Collecting system right (upper pole)',
  'Collecting system right (lower pole)',
  'Ureter right (upper pole)',
  'Ureter right (lower pole)',
  'Aorta',
  'Bladder',
];

const MRUrographyLabellingData = labels.map(item => {
  return {
    label: item,
    value: item,
  };
});

const labelToSegmentNumberMap = {};

for (let i = 0; i < labels.length; i++) {
  const label = labels[i];
  labelToSegmentNumberMap[label] = i;
}

export { labels, labelToSegmentNumberMap, MRUrographyLabellingData };
