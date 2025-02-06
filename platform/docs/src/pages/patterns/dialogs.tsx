import React, { useState } from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { UserPreferencesDialog } from '../../../../ui-next/src/components/OHIFDialogs/UserPreferencesDialog';
import { AboutDialog } from '../../../../ui-next/src/components/OHIFDialogs/AboutDialog';
import { InputDialog } from '../../../../ui-next/src/components/OHIFDialogs/InputDialog';
import { PresetDialog } from '../../../../ui-next/src/components/OHIFDialogs/PresetDialog';
import { ImageDialog } from '../../../../ui-next/src/components/OHIFDialogs/ImageDialog';

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [inputDialogOpen, setInputDialogOpen] = useState(false);
  const [secondInputDialogOpen, setSecondInputDialogOpen] = useState(false);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  // For demonstration: state to manage the form fields
  const [fileName, setFileName] = useState('Image');
  const [fileType, setFileType] = useState('JPG');
  const [width, setWidth] = useState('512');
  const [height, setHeight] = useState('512');
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeWarning, setIncludeWarning] = useState(true);

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

      {/* New button to open the InputDialog */}
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

      <InputDialog
        open={inputDialogOpen}
        onOpenChange={setInputDialogOpen}
      >
        <InputDialog.InputTitle>Segment Label</InputDialog.InputTitle>
        <InputDialog.InputPlaceholder
          placeholder="Label"
          // Optionally include onChange, value, etc.
        />
        <InputDialog.InputActions
          onCancel={() => setInputDialogOpen(false)}
          onSave={() => {
            console.log('Saved!');
            setInputDialogOpen(false);
          }}
        />
      </InputDialog>

      <InputDialog
        open={secondInputDialogOpen}
        onOpenChange={setSecondInputDialogOpen}
      >
        <InputDialog.InputTitle>Another Example</InputDialog.InputTitle>
        <InputDialog.InputPlaceholder
          placeholder="Second Label"
          // onChange, value, etc.
        />
        <InputDialog.InputActions
          onCancel={() => setSecondInputDialogOpen(false)}
          onSave={() => {
            console.log('Second dialog saved!');
            setSecondInputDialogOpen(false);
          }}
        />
      </InputDialog>

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
            {/* Each Option is a separate component instance */}
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
      <ImageDialog
        open={imageDialogOpen}
        onOpenChange={setImageDialogOpen}
      >
        <ImageDialog.ImageTitle>Download High Quality Image</ImageDialog.ImageTitle>

        {/* Responsive split layout: image on top for mobile, side-by-side for larger screens */}
        <div className="flex flex-col sm:flex-row">
          <ImageDialog.ImageVisual
            src="https://dummyimage.com/512x512/242424/7BB2CE.png" // replace with your own image
            alt="Preview"
          />
          <ImageDialog.ImageOptions>
            {/* Filename & Filetype on the same row */}
            <div className="flex items-center space-x-2">
              <ImageDialog.Filename
                value={fileName}
                onChange={e => setFileName(e.target.value)}
              />
              <ImageDialog.Filetype
                selected={fileType}
                onSelect={val => setFileType(val)}
              />
            </div>

            <ImageDialog.ImageSize
              width={width}
              height={height}
              onWidthChange={e => setWidth(e.target.value)}
              onHeightChange={e => setHeight(e.target.value)}
            />

            <ImageDialog.SwitchOption
              label="Include annotations"
              checked={includeAnnotations}
              onCheckedChange={val => setIncludeAnnotations(val)}
            />
            <ImageDialog.SwitchOption
              label="Include warning message"
              checked={includeWarning}
              onCheckedChange={val => setIncludeWarning(val)}
            />

            <ImageDialog.Actions
              onCancel={() => setImageDialogOpen(false)}
              onSave={() => {
                console.log('Saving with settings:', {
                  fileName,
                  fileType,
                  width,
                  height,
                  includeAnnotations,
                  includeWarning,
                });
                setImageDialogOpen(false);
              }}
            />
          </ImageDialog.ImageOptions>
        </div>
      </ImageDialog>
    </>
  );
}
