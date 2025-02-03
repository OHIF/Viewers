import React, { useState } from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { UserPreferencesDialog } from '../../../../ui-next/src/components/OHIFDialogs/UserPreferencesDialog';

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      {/* Button on the page that triggers the dialog */}
      <Button onClick={() => setDialogOpen(true)}>Open Preferences</Button>

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
    </>
  );
}