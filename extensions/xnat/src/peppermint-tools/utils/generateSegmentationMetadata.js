import GeneralAnatomyList from './GeneralAnatomyList.js';
import generateUID from'../utils/generateUID.js';

const categories = GeneralAnatomyList.SegmentationCodes.Category;

export default function generateMetadata(
  label,
  categoryUID = 'T-D0050',
  typeUID = 'T-D0050',
  modifierUID
) {
  const category = categories.find(
    categoriesI => categoriesI.CodeValue === categoryUID
  );
  const type = category.Type.find(typesI => typesI.CodeValue === typeUID);

  const metadata = {
    SegmentedPropertyCategoryCodeSequence: {
      CodeValue: category.CodeValue,
      CodingSchemeDesignator: category.CodingSchemeDesignator,
      CodeMeaning: category.CodeMeaning,
    },
    SegmentLabel: label,
    SegmentAlgorithmType: 'MANUAL',

    SegmentedPropertyTypeCodeSequence: {
      CodeValue: type.CodeValue,
      CodingSchemeDesignator: type.CodingSchemeDesignator,
      CodeMeaning: type.CodeMeaning,
    },
    uid: generateUID(),
  };

  if (modifierUID) {
    const modfier = type.Modifier.find(
      modifierI => modifierI.CodeValue === modifierUID
    );

    metadata.SegmentedPropertyTypeCodeSequence.SegmentedPropertyTypeModifierCodeSequence = {
      CodeValue: modfier.CodeValue,
      CodingSchemeDesignator: modfier.CodingSchemeDesignator,
      CodeMeaning: modfier.CodeMeaning,
    };

    metadata.RecommendedDisplayCIELabValue = modfier.recommendedDisplayRGBValue;
  } else {
    metadata.RecommendedDisplayCIELabValue = type.recommendedDisplayRGBValue;
  }

  return metadata;
}
