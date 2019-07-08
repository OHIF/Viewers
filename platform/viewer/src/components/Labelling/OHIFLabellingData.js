const items = [
  'Abdomen/Chest Wall',
  'Adrenal',
  'Bladder',
  'Bone',
  'Brain',
  'Breast',
  'Colon',
  'Esophagus',
  'Extremities',
  'Gallbladder',
  'Kidney',
  'Liver',
  'Lung',
  'Lymph Node',
  'Mediastinum/Hilum',
  'Muscle',
  'Neck',
  'Other Soft Tissue',
  'Ovary',
  'Pancreas',
  'Pelvis',
  'Peritoneum/Omentum',
  'Prostate',
  'Retroperitoneum',
  'Small Bowel',
  'Spleen',
  'Stomach',
  'Subcutaneous',
];

const OHIFLabellingData = items.map(item => {
  return {
    label: item,
    value: item,
  };
});

export default OHIFLabellingData;
