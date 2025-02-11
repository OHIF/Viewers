import React from 'react';
import { AboutDialog } from '@ohif/ui-next';

function AboutModal({ onOpenChange, open }) {
  return (
    <AboutDialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <AboutDialog.Title>About OHIF Viewer</AboutDialog.Title>
      <AboutDialog.ProductName>OHIF Viewer</AboutDialog.ProductName>
      <AboutDialog.ProductVersion>3.10</AboutDialog.ProductVersion>
      <AboutDialog.ProductBeta>beta.75</AboutDialog.ProductBeta>

      <AboutDialog.Body>
        <AboutDialog.DetailItem
          label="Commit Hash"
          value="ac6е674b4d094f942556d045178011bbf3f81796"
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
