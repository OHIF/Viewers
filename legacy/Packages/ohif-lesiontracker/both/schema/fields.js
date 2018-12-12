export const FieldLesionLocation = {
    type: String,
    label: 'Lesion Location',
    allowedValues: [
        '',
        'Abdominal/Chest Wall',
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
        'Other: Soft Tissue',
        'Ovary',
        'Pancreas',
        'Pelvis',
        'Peritoneum/Omentum',
        'Prostate',
        'Retroperitoneum',
        'Small Bowel',
        'Spleen',
        'Stomach',
        'Subcutaneous'
    ]
};

export const FieldLesionLocationResponse = {
    type: String,
    label: 'Lesion Location Response',
    allowedValues: [
        '',
        'CR',
        'PD',
        'SD',
        'Present',
        'NE',
        'NN',
        'EX'
    ],
    valuesLabels: [
        '',
        'CR - Complete response',
        'PD - Progressive disease',
        'SD - Stable disease',
        'Present - Present',
        'NE - Not Evaluable',
        'NN - Non-CR/Non-PD',
        'EX - Excluded from Assessment'
    ]
};
