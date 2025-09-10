import React from 'react';
import { MMGReportData } from '../../forms/MMGReportForms';

export const StudyInfoFields: React.FC<{ reportData: MMGReportData }> = ({ reportData }) => {
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%' }}>
      <tbody>
        <tr>
          <td style={{ width: '24.9769%' }}>
            <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <strong>Patient ID</strong>
            </span>
          </td>
          <td style={{ width: '25.0231%' }}>
            {reportData.patient_id}
            <br />
          </td>
          <td style={{ width: '24.9769%', textAlign: 'left' }}>
            <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <strong>Patient Age</strong>
            </span>
          </td>
          <td style={{ width: '24.9769%' }}>
            {reportData?.patient_age}
            <br />
          </td>
        </tr>
        <tr>
          <td style={{ width: '24.9769%' }}>
            <strong>Study Date</strong>
          </td>
          <td>
            {reportData?.study_date}
            <br />
          </td>
          <td style={{ width: '24.9769%', textAlign: 'left' }}>
            <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <strong>Image Type</strong>
            </span>
          </td>
          <td style={{ width: '24.9769%' }}>
            {reportData?.image_type ? reportData?.image_type : ''}
            <br />
          </td>
        </tr>
        <tr>
          <td style={{ width: '24.9769%' }}>
            <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <span style={{ fontSize: 16 }}>
                <strong>Manufacturer</strong>
              </span>
            </span>
            <br />
          </td>
          <td colSpan={3}>
            {reportData?.manufacturer ? reportData?.manufacturer : ''}
            <br />
          </td>
        </tr>
        <tr>
          <td style={{ width: '24.9769%' }}>
            <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <span style={{ fontSize: 16 }}>
                <strong>Case Assessment Time</strong>
              </span>
            </span>
          </td>
          <td colSpan={3}>
            {reportData?.case_assessment_time ? reportData?.case_assessment_time : ''}
            <br />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
