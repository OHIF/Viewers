import React from 'react';
import { useTranslation } from 'react-i18next';
import { Segmentation } from './contexts/SegmentationTableContext';

/**
 * Displays the segmentation label. When the label is blank, shows a translated
 * "No description" with the series/modality suffix styled in a lighter, muted font.
 */
export const SegmentationLabel = ({ segmentation }: { segmentation: Segmentation }) => {
  const { t } = useTranslation('SegmentationPanel');

  if (!segmentation) {
    return null;
  }

  if (segmentation.label) {
    return <>{segmentation.label}</>;
  }

  const suffix = segmentation.fallbackLabel;
  return (
    <>
      <span>{t('No description')}</span>
      {suffix && <span className="text-muted-foreground text-xxs">&nbsp;&nbsp;{suffix}</span>}
    </>
  );
};
