import React, { useState } from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { UserPreferencesDialog } from '../../../../ui-next/src/components/OHIFDialogs/UserPreferencesDialog';
import { AboutDialog } from '../../../../ui-next/src/components/OHIFDialogs/AboutDialog';
import { InputDialog } from '../../../../ui-next/src/components/OHIFDialogs/InputDialog';
import { PresetDialog } from '../../../../ui-next/src/components/OHIFDialogs/PresetDialog';
import { ImageDialog } from '../../../../ui-next/src/components/OHIFDialogs/ImageDialog';

export default function SettingsPage() {
  // We only keep these booleans for toggling the dialogs open/close
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [secondInputDialogOpen, setSecondInputDialogOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  return (
    <>
      {/* Buttons to open each dialog */}
      <Button onClick={() => setDialogOpen(true)}>Open Preferences</Button>
      <Button
        onClick={() => setAboutOpen(true)}
        className="ml-2"
      >
        Open About
      </Button>
      <Button
        onClick={() => setInputDialogOpen(true)}
        className="ml-2"
      >
        Open InputDialog
      </Button>
      <Button
        onClick={() => setSecondInputDialogOpen(true)}
        className="ml-2"
      >
        Open Second InputDialog
      </Button>
      <Button
        onClick={() => setPresetDialogOpen(true)}
        className="ml-2"
      >
        Open PresetDialog
      </Button>
      <Button
        onClick={() => setImageDialogOpen(true)}
        className="ml-2"
      >
        Open ImageDialog
      </Button>

      {/* Preferences Dialog */}
      <UserPreferencesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <UserPreferencesDialog.Title>User Preferences</UserPreferencesDialog.Title>
        <div className="flex max-h-[80vh] flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="mt-4 mb-4">
              <UserPreferencesDialog.Body>
                <UserPreferencesDialog.HotkeysGrid>
                  {/* A handful of Hotkeys (no changes needed here) */}
                  <UserPreferencesDialog.Hotkey
                    label="Zoom"
                    placeholder="z"
                  />
                  <UserPreferencesDialog.Hotkey
                    label="Zoom In"
                    placeholder="z"
                  />
                  {/* ...etc. */}
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

      {/* About Dialog */}
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
          {/* ...etc. */}
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

      {/* Input Dialogs */}
      <InputDialog
        open={inputDialogOpen}
        onOpenChange={setInputDialogOpen}
      >
        <InputDialog.InputTitle>Segment Label</InputDialog.InputTitle>
        <InputDialog.InputPlaceholder placeholder="Label" />
        <InputDialog.InputActions
          onCancel={() => setInputDialogOpen(false)}
          onSave={() => setInputDialogOpen(false)}
        />
      </InputDialog>

      <InputDialog
        open={secondInputDialogOpen}
        onOpenChange={setSecondInputDialogOpen}
      >
        <InputDialog.InputTitle>Another Example</InputDialog.InputTitle>
        <InputDialog.InputPlaceholder placeholder="Second Label" />
        <InputDialog.InputActions
          onCancel={() => setSecondInputDialogOpen(false)}
          onSave={() => setSecondInputDialogOpen(false)}
        />
      </InputDialog>

      {/* Preset Dialog */}
      <PresetDialog
        open={presetDialogOpen}
        onOpenChange={setPresetDialogOpen}
      >
        <PresetDialog.PresetTitle>Rendering Presets</PresetDialog.PresetTitle>
        <PresetDialog.PresetBody>
          <PresetDialog.PresetFilter>
            <PresetDialog.PresetSearch placeholder="Search all" />
          </PresetDialog.PresetFilter>
          <PresetDialog.PresetGrid maxHeight="max-h-80">
            {/* Sample Presets */}
            <PresetDialog.PresetOption label="Option 1" />
            <PresetDialog.PresetOption label="Option 2" />
            {/* ...etc. */}
          </PresetDialog.PresetGrid>
        </PresetDialog.PresetBody>
        <PresetDialog.PresetActions
          onCancel={() => setPresetDialogOpen(false)}
          onSave={() => setPresetDialogOpen(false)}
        />
      </PresetDialog>

      {/* Image Dialog */}
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
      >
        <ImageDialog.ImageTitle>Download High Quality Image</ImageDialog.ImageTitle>

        <div className="flex flex-col sm:flex-row">
          <ImageDialog.ImageVisual
            src="https://dummyimage.com/512x512/242424/7BB2CE.png"
            alt="Preview"
          />
          <ImageDialog.ImageOptions>
            {/* Hard-coded text, no local state, no empty handlers needed */}
            <div className="flex items-end space-x-2">
              <ImageDialog.Filename value="Image">File name</ImageDialog.Filename>

              <ImageDialog.Filetype selected="JPG" />
            </div>

            <ImageDialog.ImageSize
              width="512"
              height="512"
            >
              Image size <span className="text-muted-foreground">px</span>
            </ImageDialog.ImageSize>

            <ImageDialog.SwitchOption defaultChecked>Include annotations</ImageDialog.SwitchOption>
            <ImageDialog.SwitchOption defaultChecked>
              Include warning message
            </ImageDialog.SwitchOption>

            <ImageDialog.Actions
              onCancel={() => setImageDialogOpen(false)}
              onSave={() => setImageDialogOpen(false)}
            />
          </ImageDialog.ImageOptions>
        </div>
      </ImageDialog>
    </>
  );
}
