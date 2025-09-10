import React from 'react';
import { AfiriLogo, CmhLogo, EclinicLogo, IdcLogo, XylexaLogo } from '../../clientLogos';

const logosMap = {
  xylexaLogo: (
    <XylexaLogo
      width="50%"
      height="50%"
    />
  ),
  afiriLogo: (
    <AfiriLogo
      width="50%"
      height="50%"
    />
  ),
  cmhLogo: (
    <CmhLogo
      width="50%"
      height="50%"
    />
  ),
  eClinicLogo: (
    <EclinicLogo
      width="50%"
      height="50%"
    />
  ),
  idcLogo: (
    <IdcLogo
      width="50%"
      height="50%"
    />
  ),
};

export type Logos = 'xylexaLogo' | 'afiriLogo' | 'cmhLogo' | 'eClinicLogo' | 'idcLogo';

export type ReportHeaderProps = {
  heading: string;
  address: string;
  contact: string;
  logo: Logos;
};

export const ReportHeader: React.FC<ReportHeaderProps> = ({ heading, address, contact, logo }) => {
  return (
    <table
      style={{
        borderCollapse: 'collapse',
        fontFamily: 'Arial, Helvetica, sans-serif',
        width: '100%',
        textAlign: 'center',
      }}
    >
      <tbody>
        <tr>
          <td style={{ width: '11.73%', paddingLeft: 20 }}>
            {logosMap[logo]}
            <br />
          </td>
          <td style={{ width: '88.18%', textAlign: 'center', lineHeight: 1 }}>
            <span style={{ fontSize: 30 }}>
              <strong>
                <span style={{ fontSize: 30 }}>{heading}</span>
                <br />
                <span style={{ fontSize: 16 }}>
                  {address}
                  <br />
                  {contact}
                </span>
              </strong>
            </span>
            <br />
          </td>
        </tr>
      </tbody>
    </table>
  );
};
