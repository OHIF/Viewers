import React from 'react';
import { AboutDialog } from '@ohif/ui-next';

function AboutModal({ versionNumber, commitHash }: { versionNumber: string; commitHash: string }) {
  return (
    <AboutDialog>
      <AboutDialog.ProductName>OHIF Viewer</AboutDialog.ProductName>
      <AboutDialog.ProductVersion>{versionNumber}</AboutDialog.ProductVersion>

      <AboutDialog.Body>
        <AboutDialog.DetailItem
          label="Commit Hash"
          value={commitHash}
        />
        <AboutDialog.DetailItem
          label="Current Browser & OS"
          value="Safari 18.2.0, macOS 10.15.7"
        />
        <AboutDialog.SocialItem
          icon="SocialGithub"
          url="OHIF/Viewers"
          text="github.com/OHIF/Viewers"
        />
      </AboutDialog.Body>
    </AboutDialog>
  );
}

export default {
  'ohif.aboutModal': AboutModal,
};
