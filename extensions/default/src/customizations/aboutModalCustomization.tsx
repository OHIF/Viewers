import React from 'react';
import { AboutModal } from '@ohif/ui-next';

type AboutModalDefaultProps = {
  versionNumber: string;
  commitHash: string;
};

function AboutModalDefault({ versionNumber, commitHash }: AboutModalDefaultProps) {
  return (
    <AboutModal>
      <AboutModal.ProductName>OHIF Viewer</AboutModal.ProductName>
      <AboutModal.ProductVersion>{versionNumber}</AboutModal.ProductVersion>

      <AboutModal.Body>
        <AboutModal.DetailItem
          label="Commit Hash"
          value={commitHash}
        />
        <AboutModal.DetailItem
          label="Current Browser & OS"
          value="Safari 18.2.0, macOS 10.15.7"
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
