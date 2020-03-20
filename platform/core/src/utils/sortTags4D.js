const sortTags4D = [
  // Tags relevant for 4D series stack sorting. These are in priority order.
  'TemporalPositionIdentifier',
  'DiffusionBValue',
  'TriggerTime',
  'EchoTime',
  'FlipAngle',
  'RepetitionTime',
  'AcquisitionTime',
  'SeriesTime',
  'ContentTime',
  'ScanOptions', // Siemens Somatom Cardiac CT 'ScanOptions' tag contains info on cardiac cycle
  'NominalPercentageOfCardiacPhase', // GE Revolution CT uses 'NominalPercentageOfCardiacPhase' tag to identify cardiac cycle
  '0019100C', // Siemens B Value
  '00431039', //GEBValue
  '20011003', // Philips DWI B Value,
  '0043101E', // GE Revolution CT Kinematics protocol DeltaStartTime
  'SequenceName',
  'MRDiffusionSequence',
];

export default sortTags4D;
