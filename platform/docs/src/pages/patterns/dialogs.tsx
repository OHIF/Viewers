import React, { useState } from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { UserPreferencesDialog } from '../../../../ui-next/src/components/OHIFDialogs/UserPreferencesDialog';
import { AboutDialog } from '../../../../ui-next/src/components/OHIFDialogs/AboutDialog';
import { InputDialog } from '../../../../ui-next/src/components/OHIFDialogs/InputDialog';
import { PresetDialog } from '../../../../ui-next/src/components/OHIFDialogs/PresetDialog';
import { ImageDialog } from '../../../../ui-next/src/components/OHIFDialogs/ImageDialog';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../../ui-next/src/components/Select/Select';
import { Icons } from '../../../../ui-next/src/components/Icons';

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
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex space-x-2">
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
        </div>
      </div>

      <UserPreferencesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      >
        <UserPreferencesDialog.Title>User Preferences</UserPreferencesDialog.Title>

        <UserPreferencesDialog.Body>
          {/* Language Section */}
          <div className="mb-3 flex items-center space-x-14">
            <UserPreferencesDialog.SubHeading>Language</UserPreferencesDialog.SubHeading>
            <Select defaultValue="English">
              <SelectTrigger
                className="w-60"
                aria-label="Language"
              >
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hotkeys Section */}
          <UserPreferencesDialog.SubHeading>Hotkeys</UserPreferencesDialog.SubHeading>
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

        <UserPreferencesDialog.Footer
          onRestoreDefaults={() => console.log('Restore Defaults clicked')}
          onCancel={() => setDialogOpen(false)}
          onSave={() => console.log('Save clicked')}
        />
      </UserPreferencesDialog>

      {/* About Dialog */}
      <AboutDialog
        open={aboutOpen}
        onOpenChange={setAboutOpen}
      >
        <AboutDialog.Title>About OHIF Viewer</AboutDialog.Title>
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
              <Icons.ByName name="SocialGithub" />
            </AboutDialog.SocialIcon>
            <AboutDialog.SocialLink href="https://github.com/OHIF/Viewers">
              github.com/OHIF/Viewers
            </AboutDialog.SocialLink>
          </div>
        </AboutDialog.Body>
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
            <PresetDialog.PresetOption label="Option 1" />
            <PresetDialog.PresetOption label="Option 2" />
            <PresetDialog.PresetOption label="Option 3" />
            <PresetDialog.PresetOption label="Option 4" />
            <PresetDialog.PresetOption label="Option 5" />
            <PresetDialog.PresetOption label="Option 6" />
            <PresetDialog.PresetOption label="Option 7" />
            <PresetDialog.PresetOption label="Option 8" />
            <PresetDialog.PresetOption label="Option 1" />
            <PresetDialog.PresetOption label="Option 2" />
            <PresetDialog.PresetOption label="Option 3" />
            <PresetDialog.PresetOption label="Option 4" />
            <PresetDialog.PresetOption label="Option 5" />
            <PresetDialog.PresetOption label="Option 6" />
            <PresetDialog.PresetOption label="Option 7" />
            <PresetDialog.PresetOption label="Option 8" />
            <PresetDialog.PresetOption label="Option 1" />
            <PresetDialog.PresetOption label="Option 2" />
            <PresetDialog.PresetOption label="Option 3" />
            <PresetDialog.PresetOption label="Option 4" />
            <PresetDialog.PresetOption label="Option 5" />
            <PresetDialog.PresetOption label="Option 6" />
            <PresetDialog.PresetOption label="Option 7" />
            <PresetDialog.PresetOption label="Option 8" />
            <PresetDialog.PresetOption label="Option 1" />
            <PresetDialog.PresetOption label="Option 2" />
            <PresetDialog.PresetOption label="Option 3" />
            <PresetDialog.PresetOption label="Option 4" />
            <PresetDialog.PresetOption label="Option 5" />
            <PresetDialog.PresetOption label="Option 6" />
            <PresetDialog.PresetOption label="Option 7" />
            <PresetDialog.PresetOption label="Option 8" />
          </PresetDialog.PresetGrid>
        </PresetDialog.PresetBody>

        <PresetDialog.PresetActions
          onCancel={() => setPresetDialogOpen(false)}
          onSave={() => {
            console.log('Saved Preset!');
            setPresetDialogOpen(false);
          }}
        />
      </PresetDialog>

      {/* Image Dialog */}
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
      >
        <ImageDialog.ImageTitle>Download High Quality Image</ImageDialog.ImageTitle>

        <ImageDialog.Body>
          <ImageDialog.ImageVisual
            src="https://dummyimage.com/512x512/242424/7BB2CE.png"
            alt="Preview"
          />
          <ImageDialog.ImageOptions>
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
        </ImageDialog.Body>
      </ImageDialog>
    </>
  );
}
