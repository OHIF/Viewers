import React from 'react';
import { Combobox } from '../../../../ui-next/src/components/Combobox/Combobox';
import ShowcaseRow from './ShowcaseRow';

/**
 * ComboboxShowcase demonstrates the searchable Combobox component with a
 * comprehensive “Modality” list.
 */
export default function ComboboxShowcase() {
  const modalities = [
    'AR',
    'ASMT',
    'AU',
    'BDUS',
    'BI',
    'BMD',
    'CR',
    'CT',
    'CTPROTOCOL',
    'DG',
    'DOC',
    'DX',
    'ECG',
    'EPS',
    'ES',
    'FID',
    'GM',
    'HC',
    'HD',
    'IO',
    'IOL',
    'IVOCT',
    'IVUS',
    'KER',
    'KO',
    'LEN',
    'LS',
    'MG',
    'MR',
    'M3D',
    'NM',
    'OAM',
    'OCT',
    'OP',
    'OPM',
    'OPT',
    'OPTBSV',
    'OPTENF',
    'OPV',
    'OSS',
    'OT',
    'PLAN',
    'PR',
    'PT',
    'PX',
    'REG',
    'RESP',
    'RF',
    'RG',
    'RTDOSE',
    'RTIMAGE',
    'RTINTENT',
    'RTPLAN',
    'RTRAD',
    'RTRECORD',
    'RTSEGANN',
    'RTSTRUCT',
    'RWV',
    'SEG',
    'SM',
    'SMR',
    'SR',
    'SRF',
    'STAIN',
    'TEXTUREMAP',
    'TG',
    'US',
    'VA',
    'XA',
    'XC',
  ].map(m => ({ value: m, label: m }));

  return (
    <ShowcaseRow
      title="Combobox"
      description="Searchable dropdown built with Command + Popover primitives."
      code={`
const modalities = [
  'AR','ASMT','AU','BDUS','BI','BMD','CR','CT','CTPROTOCOL','DG','DOC','DX','ECG','EPS','ES','FID',
  'GM','HC','HD','IO','IOL','IVOCT','IVUS','KER','KO','LEN','LS','MG','MR','M3D','NM','OAM','OCT',
  'OP','OPM','OPT','OPTBSV','OPTENF','OPV','OSS','OT','PLAN','PR','PT','PX','REG','RESP','RF','RG',
  'RTDOSE','RTIMAGE','RTINTENT','RTPLAN','RTRAD','RTRECORD','RTSEGANN','RTSTRUCT','RWV','SEG','SM',
  'SMR','SR','SRF','STAIN','TEXTUREMAP','TG','US','VA','XA','XC',
].map(m => ({ value: m, label: m }));

<Combobox data={modalities} placeholder="Modality" />
      `}
    >
      <Combobox
        data={modalities}
        placeholder="Modality"
      />
    </ShowcaseRow>
  );
}
