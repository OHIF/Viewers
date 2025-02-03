import React, { useState } from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { UserPreferencesDialog } from '../../../../ui-next/src/components/OHIFDialogs/UserPreferencesDialog';
import { AboutDialog } from '../../../../ui-next/src/components/OHIFDialogs/AboutDialog';

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <>
      {/* Button on the page that triggers the dialog */}
      <Button onClick={() => setDialogOpen(true)}>Open Preferences</Button>

      {/* Button to open the About dialog */}
      <Button
        onClick={() => setAboutOpen(true)}
        className="ml-2"
      >
        Open About
      </Button>

      <UserPreferencesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        {/* Dialog header/title */}
        <UserPreferencesDialog.Title>User Preferences</UserPreferencesDialog.Title>

        <div className="flex max-h-[80vh] flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mt-4 mb-4">
              <UserPreferencesDialog.Body>
                <UserPreferencesDialog.HotkeysGrid>
                  <UserPreferencesDialog.Hotkey
                    label="Zoom"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Zoom In"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Zoom Out"
                    placeholder="-"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Zoom to Fit"
                    placeholder="="
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Rotate Right"
                    placeholder="r"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Rotate Left"
                    placeholder="l"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Flip Horizontal"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Flip Vertical"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Invert"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Next Viewport"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Previous Viewport"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Next Series"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Previous Series"
                    placeholder="-"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Next Stage"
                    placeholder="="
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Previous Stage"
                    placeholder="r"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Next Image"
                    placeholder="l"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Previous Image"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="First Image"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Last Image"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Reset"
                    placeholder="z"
                  />
                </UserPreferencesDialog.HotkeysGrid>
              </UserPreferencesDialog.Body>
            </div>
          </div>
          <div className="flex-shrink-0">
            <UserPreferencesDialog.Footer
              onRestoreDefaults={() => console.log('Restore Defaults clicked')}
              onCancel={() => setDialogOpen(false)}
              onSave={() => console.log('Save clicked')}
            />
          </div>
        </div>
      </UserPreferencesDialog>

      {/* New AboutDialog usage */}
      <AboutDialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
      >
        <AboutDialog.ProductName>OHIF Viewer</AboutDialog.ProductName>
        <AboutDialog.ProductVersion>3.10</AboutDialog.ProductVersion>
        <AboutDialog.ProductBeta>beta.75</AboutDialog.ProductBeta>

        <AboutDialog.Body>
          <AboutDialog.DetailTitle>Commit Hash</AboutDialog.DetailTitle>
          <AboutDialog.Detail>ac6е674b4d094f942556d045178011bbf3f81796</AboutDialog.Detail>

          <AboutDialog.DetailTitle>Current Browser &amp; OS</AboutDialog.DetailTitle>
          <AboutDialog.Detail>Safari 18.2.0, macOS 10.15.7</AboutDialog.Detail>

          <div className="mt-4 flex items-center space-x-2">
            <AboutDialog.SocialIcon>
              {/* Replace with your SVG or icon for GitHub */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 .5C5.37.5 0 5.87 0 12.5... (GitHub icon path data)" />
              </svg>
            </AboutDialog.SocialIcon>
            <AboutDialog.SocialLink href="https://github.com/OHIF/Viewers">
              GitHub
            </AboutDialog.SocialLink>
          </div>
        </AboutDialog.Body>

        <AboutDialog.Footer>
          <Button
            variant="default"
            onClick={() => setAboutOpen(false)}
          >
            Close
          </Button>
        </AboutDialog.Footer>
      </AboutDialog>
    </>
  );
}
