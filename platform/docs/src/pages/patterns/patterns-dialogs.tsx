import React from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { UserPreferencesDialog } from '../../../../ui-next/src/components/OHIFDialogs/UserPreferencesDialog';
import { AboutDialog } from '../../../../ui-next/src/components/OHIFDialogs/AboutDialog';
import { InputDialog } from '../../../../ui-next/src/components/OHIFDialogs/InputDialog';
import { PresetDialog } from '../../../../ui-next/src/components/OHIFDialogs/PresetDialog';
import { ImageDialog } from '../../../../ui-next/src/components/OHIFDialogs/ImageDialog';
import Modal from '../../../../ui-next/src/components/Modal/Modal';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../../ui-next/src/components/Select/Select';
import { ModalProvider, useModal } from '../../../../ui-next/src/contextProviders/ModalProvider';

const AboutButton = () => {
  const { show } = useModal();
  return (
    <Button
      onClick={() =>
        show({
          title: 'About OHIF Viewer',
          containerClassName: 'max-w-[400px]',
          content: () => {
            return (
              <AboutDialog>
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
          },
        })
      }
    >
      Open About
    </Button>
  );
};

const PreferencesButton = () => {
  const { show } = useModal();
  return (
    <Button
      onClick={() =>
        show({
          content: () => (
            <UserPreferencesDialog>
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
                onRestoreDefaults={() => console.debug('Restore Defaults clicked')}
                onCancel={() => show({})}
                onSave={() => console.debug('Save clicked')}
              />
            </UserPreferencesDialog>
          ),
          title: 'User Preferences',
          containerClassName: 'w-[70%] max-w-[900px]',
        })
      }
    >
      Open Preferences
    </Button>
  );
};

const InputButton = () => {
  const { show } = useModal();
  return (
    <Button
      onClick={() =>
        show({
          content: () => (
            <InputDialog>
              <InputDialog.InputTitle>Segment Label</InputDialog.InputTitle>
              <InputDialog.InputPlaceholder placeholder="Label" />
              <InputDialog.InputActions
                onCancel={() => show({})}
                onSave={() => show({})}
              />
            </InputDialog>
          ),
          title: 'Input Dialog',
        })
      }
    >
      Open Input
    </Button>
  );
};

const PresetButton = () => {
  const { show } = useModal();
  return (
    <Button
      onClick={() =>
        show({
          content: () => (
            <PresetDialog>
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
                </PresetDialog.PresetGrid>
              </PresetDialog.PresetBody>
              <PresetDialog.PresetActions
                onCancel={() => show({})}
                onSave={() => {
                  console.debug('Saved Preset!');
                  show({});
                }}
              />
            </PresetDialog>
          ),
          title: 'Preset Dialog',
        })
      }
    >
      Open Preset
    </Button>
  );
};

const ImageButton = () => {
  const { show } = useModal();
  return (
    <Button
      onClick={() =>
        show({
          content: () => (
            <ImageDialog>
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

                  <ImageDialog.SwitchOption defaultChecked>
                    Include annotations
                  </ImageDialog.SwitchOption>
                  <ImageDialog.SwitchOption defaultChecked>
                    Include warning message
                  </ImageDialog.SwitchOption>

                  <ImageDialog.Actions
                    onCancel={() => show({})}
                    onSave={() => show({})}
                  />
                </ImageDialog.ImageOptions>
              </ImageDialog.Body>
            </ImageDialog>
          ),
          title: 'Image Dialog',
        })
      }
    >
      Open Image
    </Button>
  );
};

export default function SettingsPage() {
  return (
    <ModalProvider modal={Modal}>
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex space-x-2">
          <AboutButton />
          <PreferencesButton />
          <InputButton />
          <PresetButton />
          <ImageButton />
        </div>
      </div>
    </ModalProvider>
  );
}
