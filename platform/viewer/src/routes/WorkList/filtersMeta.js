const filtersMeta = [
  {
    name: 'patientName',
    displayName: 'Patient Name',
    inputType: 'Text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'mrn',
    displayName: 'MRN',
    inputType: 'Text',
    isSortable: true,
    gridCol: 2,
  },
  {
    name: 'studyDate',
    displayName: 'Study date',
    inputType: 'DateRange',
    isSortable: true,
    gridCol: 5,
  },
  {
    name: 'description',
    displayName: 'Description',
    inputType: 'Text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'modalities',
    displayName: 'Modality',
    inputType: 'MultiSelect',
    inputProps: {
      options: [
        { value: 'SEG', label: 'SEG' },
        { value: 'CT', label: 'CT' },
        { value: 'MR', label: 'MR' },
        { value: 'SR', label: 'SR' },
      ],
    },
    isSortable: true,
    gridCol: 3,
  },
  {
    name: 'accession',
    displayName: 'Accession',
    inputType: 'Text',
    isSortable: true,
    gridCol: 4,
  },
  {
    name: 'instances',
    displayName: 'Instances',
    inputType: 'None',
    isSortable: true,
    gridCol: 2,
  },
];

export default filtersMeta;
