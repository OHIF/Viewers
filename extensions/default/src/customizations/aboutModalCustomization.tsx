import React from 'react';
import { AboutModal } from '@ohif/ui-next';
import detect from 'browser-detect';
import { useTranslation } from 'react-i18next';

function AboutModalDefault() {
  const { t } = useTranslation('AboutModal');
  const { os, version, name } = detect();
  const browser = `${name[0].toUpperCase()}${name.substr(1)} ${version}`;
  const versionNumber = process.env.VERSION_NUMBER;

  const [main, beta] = versionNumber.split('-');

  return (
    <AboutModal className="w-[400px]">
      <AboutModal.ProductName>SmartCarePlus Imaging Viewer</AboutModal.ProductName>
      <AboutModal.ProductVersion>{main}</AboutModal.ProductVersion>
      {beta && <AboutModal.ProductBeta>{beta}</AboutModal.ProductBeta>}

      <AboutModal.Body>
        <AboutModal.DetailItem
          label={t('Current Browser & OS')}
          value={`${browser}, ${os}`}
        />
      </AboutModal.Body>
    </AboutModal>
  );
}

export default {
  'ohif.aboutModal': AboutModalDefault,
};
