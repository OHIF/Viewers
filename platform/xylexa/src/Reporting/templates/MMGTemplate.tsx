import React from 'react';
import { ReportFooter, ReportHeader, StudyInfoFields, BreastFeaturesFields } from './components';
import { MMGReportData } from '../forms/MMGReportForms';

export const MMGTemplate: React.FC<{ reportData: MMGReportData }> = ({ reportData }) => {
  return (
    <div
      className="jodit-wysiwyg"
      style={{ minHeight: 139, border: '1px solid #e2e8f0', padding: '15px' }}
    >
      <ReportHeader
        heading={'Xylexa Patient Report'}
        address={'Location: 9838 Townsville Circle, Suite 202, Highlands Ranch, CO, 80130, USA'}
        contact={'Phone: +1 (720) 569-9296 | +92 333 4506666'}
        logo={'xylexaLogo'}
      />

      <StudyInfoFields reportData={reportData} />

      <br />
      <table style={{ width: '99.723%' }}>
        <tbody>
          <BreastFeaturesFields
            breastFeatures={reportData?.right_breast}
            breastSide="rightBreast"
          />
          <br />

          <BreastFeaturesFields
            breastFeatures={reportData?.left_breast}
            breastSide="leftBreast"
          />
          <br />

          <tr>
            <td>
              <strong>
                <u>Breast Density (A / B / C / D ):</u>
              </strong>
            </td>
            <td style={{ textAlign: 'left' }}>
              {reportData?.breast_density}
              <br />
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '99.723%', marginBottom: '30%' }}>
        <tbody>
          <tr>
            <td
              style={{ width: '99.9074%' }}
              colSpan={2}
            >
              <strong>
                <u>BIRAD Score:</u>
              </strong>
              <br />
            </td>
          </tr>
          <tr>
            <td style={{ width: '49.7222%' }}>
              <p>Left Breast:</p>
            </td>
            <td style={{ width: '50.1852%', textAlign: 'left' }}>
              {reportData?.birad_scoreLeft}
              <br />
            </td>
          </tr>
          <tr>
            <td>
              <p>
                Right Breast:
                <br />
              </p>
            </td>
            <td style={{ textAlign: 'left' }}>
              {reportData?.birad_scoreRight}
              <br />
            </td>
          </tr>
          <br />
          <tr>
            <td>
              <strong>
                <u>Patient-level Assessment (Normal / Benign / Malignant):</u>
              </strong>
            </td>
            <td style={{ textAlign: 'left' }}>
              {reportData?.patient_level_assessment}
              <br />
            </td>
          </tr>
        </tbody>
      </table>

      <ReportFooter />
    </div>
  );
};
export default MMGTemplate;
