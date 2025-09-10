import React from 'react';
import { ReportHeader } from './components';
import { useAuthenticationContext } from '../../context';

export type MrmcMmgReportData = {
  study_instance_id: string;
  birad_assessment: '1' | '2' | '3' | '4' | '5';
  breast_density: 'A' | 'B' | 'C' | 'D';
  recall?: 'Yes' | 'No' | null;
  quadrant?: 'UOQ' | 'UIQ' | 'LOQ' | 'LIQ' | null;
  comments: string;
};

const MrmcTemplate: React.FC<{ reportData: MrmcMmgReportData }> = ({ reportData }) => {
  const { userInfo } = useAuthenticationContext();
  return (
    <div>
      {/* Header Table */}
      <ReportHeader
        heading={'Xylexa Patient Report'}
        address={'Location: 9838 Townsville Circle, Suite 202, Highlands Ranch, CO, 80130, USA'}
        contact={'Phone: +1 (720) 569-9296 | +92 333 4506666'}
        logo={'xylexaLogo'}
      />

      <p>
        <br />
      </p>
      <hr />
      <br />

      {/* Title */}
      <p style={{ textAlign: 'center' }}>
        <strong>
          <span style={{ fontSize: 30 }}>MRMC REPORT</span>
        </strong>
      </p>
      <br />

      {/* Info Table */}
      <table
        style={{
          borderCollapse: 'collapse',
          width: '97.88%',
          marginLeft: '1.2%',
          height: 174,
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: '48.06%' }}>
              <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <strong>Case ID</strong>
              </span>
            </td>
            <td style={{ width: '51.76%' }}>
              <input
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  color: 'black',
                  border: 'none',
                  outline: 'none',
                }}
                type="text"
                value={reportData?.study_instance_id}
                disabled
              />
            </td>
          </tr>
          <tr>
            <td>
              <strong>BI-RADS Assessment</strong>
              <br />
            </td>
            <td>
              <input
                style={{
                  backgroundColor: 'rgba(0, 0, 0, 0)',
                  color: 'black',
                  border: 'none',
                  outline: 'none',
                }}
                type="text"
                value={reportData?.birad_assessment}
                disabled
              />
              <br />
            </td>
          </tr>
          <tr>
            <td>
              <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                <span style={{ fontSize: 16 }}>
                  <strong>Breast Density</strong>
                </span>
              </span>
              <br />
            </td>
            <td>B</td>
          </tr>
          {reportData?.recall != null && (
            <tr>
              <td>
                <span style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                  <span style={{ fontSize: 16 }}>
                    <strong>Recall</strong>
                  </span>
                </span>
              </td>
              <td>
                {reportData?.recall}
                <br />
              </td>
            </tr>
          )}
          {reportData?.quadrant !== null && (
            <tr>
              <td>
                <strong>Quadrant</strong>
              </td>
              <td>
                {reportData?.quadrant}
                <br />
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p>
        <br />
      </p>
      <p>
        &nbsp; &nbsp;
        <strong style={{ fontSize: 18 }}>Comments:</strong>
      </p>
      {/* Comments Table */}
      <table
        style={{
          borderCollapse: 'collapse',
          width: '97.88%',
          marginLeft: '1.02%',
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: '100%' }}>
              {reportData?.comments}
              <br />
            </td>
          </tr>
        </tbody>
      </table>
      <br />
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
      <p>
        <br />
      </p>
      <p style={{ transform: 'translateY(16px)', fontStyle: 'italic' }}>
        &nbsp; &nbsp; &nbsp;{userInfo?.name}
      </p>
      <p>&nbsp; &nbsp; &nbsp;____________________________</p>
      <p>&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp; &nbsp;&nbsp; E-Signature</p>
      <br />
      <p>
        &nbsp; &nbsp; &nbsp;I confirm that I have independently interpreted the study cases in
        accordance with the protocol.
        <br />
        &nbsp; &nbsp; &nbsp;By providing my e-signature, I certify the accuracy of my evaluations
        and their legal validity.
      </p>
      <p>
        <br />
      </p>
    </div>
  );
};

export default MrmcTemplate;
