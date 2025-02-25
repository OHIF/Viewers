import React from 'react';
import { AboutModal } from '@ohif/ui-next';
import detect from 'browser-detect';

function AboutModalDefault() {
  const { os, version, name } = detect();
  const browser = `${name[0].toUpperCase()}${name.substr(1)} ${version}`;
  const versionNumber = process.env.VERSION_NUMBER;
  const commitHash = process.env.COMMIT_HASH;

  const [main, beta] = versionNumber.split('-');

  return (
    <AboutModal className="w-[400px]">
      <AboutModal.ProductName>OHIF Viewer</AboutModal.ProductName>
      <AboutModal.ProductVersion>{main}</AboutModal.ProductVersion>
      {beta && <AboutModal.ProductBeta>{beta}</AboutModal.ProductBeta>}

      <AboutModal.Body>
        <AboutModal.DetailItem
          label="Commit Hash"
          value={commitHash}
        />
        <AboutModal.DetailItem
          label="Current Browser & OS"
          value={`${browser}, ${os}`}
        />
        <AboutModal.SocialItem
          icon="SocialGithub"
          url="OHIF/Viewers"
          text="github.com/OHIF/Viewers"
        />
      </AboutModal.Body>
    </AboutModal>
  );
}

export default {
  'ohif.aboutModal': AboutModalDefault,
};
