import React from 'react';
import { BreastFeatures } from '../../forms/MMGReportForms';

export type BreastSide = 'rightBreast' | 'leftBreast';

export type BreastFeatureFieldProps = {
  breastSide: BreastSide;
  breastFeatures: BreastFeatures[];
};
export const BreastFeaturesFields: React.FC<BreastFeatureFieldProps> = ({
  breastFeatures,
  breastSide,
}) => {
  const breastSideMap = {
    rightBreast: 'Right Breast',
    leftBreast: 'Left Breast',
  };
  return (
    <React.Fragment>
      <tr>
        <td colSpan={2}>
          <strong>
            <u>{breastSideMap[breastSide]}</u>
          </strong>
          <br />
        </td>
      </tr>
      {breastFeatures?.map((breaseFeature, index) => {
        return (
          <React.Fragment key={`${breastSide}-${breaseFeature.uuid}`}>
            <tr>
              <td
                style={{ width: '99.9074%' }}
                colSpan={2}
              >
                <strong>
                  <u>Lesion #{index + 1}</u>
                </strong>
                <br />
              </td>
            </tr>
            <tr>
              <td style={{ width: '49.7222%' }}>
                <p>Lesion Type, Size &amp; Location:</p>
              </td>
              <td style={{ width: '50.1852%', textAlign: 'left' }}>
                {breaseFeature.lesion_type && `${breaseFeature.lesion_type}, `}
                {breaseFeature.mass_type && `${breaseFeature.mass_type}, `}
                {breaseFeature.calcification_type && `${breaseFeature.calcification_type}, `}
                {breaseFeature.lesion_size} (mm)
                {breaseFeature.lesion_locationQuadrant &&
                  `, ${breaseFeature.lesion_locationQuadrant}`}
                {breaseFeature.lesion_locationOclock &&
                  `, ${breaseFeature.lesion_locationOclock} O'clock`}
                <br />
              </td>
            </tr>
          </React.Fragment>
        );
      })}
    </React.Fragment>
  );
};
