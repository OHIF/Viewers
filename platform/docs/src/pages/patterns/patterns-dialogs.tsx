import React from 'react';
import { Button } from '../../../../ui-next/src/components/Button';
import { AboutModal } from '../../../../ui-next/src/components/OHIFModals/AboutModal';
import { InputDialog } from '../../../../ui-next/src/components/OHIFDialogs/InputDialog';
import { PresetDialog } from '../../../../ui-next/src/components/OHIFDialogs/PresetDialog';
import { ImageModal } from '../../../../ui-next/src/components/OHIFModals/ImageModal';
import { UserPreferencesModal } from '../../../../ui-next/src/components/OHIFModals/UserPreferencesModal';
import Modal from '../../../../ui-next/src/components/Modal/Modal';
import { FooterAction } from '../../../../ui-next/src/components/FooterAction';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../../../ui-next/src/components/Select/Select';
import { ModalProvider, useModal } from '../../../../ui-next/src/contextProviders/ModalProvider';

// ===== Modal Components =====

const AboutButton = () => {
  const { show } = useModal();
  return (
    <Button
      onClick={() =>
        show({
          title: 'About OHIF Viewer',
          content: () => {
            return (
              <AboutModal className="w-[400px]">
                <AboutModal.ProductName>OHIF Viewer</AboutModal.ProductName>
                <AboutModal.ProductVersion>3.10</AboutModal.ProductVersion>
                <AboutModal.ProductBeta>beta.75</AboutModal.ProductBeta>

                <AboutModal.Body>
                  <AboutModal.DetailItem
                    label="Commit Hash"
                    value="ac6е674b4d094f942556d045178011bbf3f81796"
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
          title: 'User Preferences',
          content: ({ hide }) => (
            <UserPreferencesModal className="max-w-[900px]">
              <UserPreferencesModal.Body>
                {/* Language Section */}
                <div className="mb-3 flex items-center space-x-14">
                  <UserPreferencesModal.SubHeading>Language</UserPreferencesModal.SubHeading>
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

                <UserPreferencesModal.SubHeading>Hotkeys</UserPreferencesModal.SubHeading>
                <UserPreferencesModal.HotkeysGrid>
                  {[
                    { label: 'Zoom', placeholder: 'z' },
                    { label: 'Zoom In', placeholder: 'z' },
                    { label: 'Zoom Out', placeholder: '-' },
                    { label: 'Zoom to Fit', placeholder: '=' },
                    { label: 'Rotate Right', placeholder: 'r' },
                    { label: 'Rotate Left', placeholder: 'l' },
                    { label: 'Flip Horizontal', placeholder: 'z' },
                    { label: 'Flip Vertical', placeholder: 'z' },
                    { label: 'Invert', placeholder: 'z' },
                    { label: 'Next Viewport', placeholder: 'z' },
                    { label: 'Previous Viewport', placeholder: 'z' },
                    { label: 'Next Series', placeholder: 'z' },
                    { label: 'Previous Series', placeholder: '-' },
                    { label: 'Next Stage', placeholder: '=' },
                    { label: 'Previous Stage', placeholder: 'r' },
                    { label: 'Previous Image', placeholder: 'l' },
                    { label: 'First Image', placeholder: 'z' },
                    { label: 'Last Image', placeholder: 'z' },
                    { label: 'Reset', placeholder: 'z' },
                  ].map(hotkey => (
                    <UserPreferencesModal.Hotkey
                      key={hotkey.label}
                      label={hotkey.label}
                      placeholder={hotkey.placeholder}
                    />
                  ))}
                </UserPreferencesModal.HotkeysGrid>
              </UserPreferencesModal.Body>
              <FooterAction>
                <FooterAction.Left>
                  <FooterAction.Auxiliary onClick={() => {}}>
                    Restore Defaults
                  </FooterAction.Auxiliary>
                </FooterAction.Left>
                <FooterAction.Right>
                  <FooterAction.Secondary onClick={() => hide()}>Cancel</FooterAction.Secondary>
                  <FooterAction.Primary onClick={() => hide()}>Save</FooterAction.Primary>
                </FooterAction.Right>
              </FooterAction>
            </UserPreferencesModal>
          ),
        })
      }
    >
      Open Preferences
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
            <ImageModal>
              <ImageModal.Body>
                <ImageModal.ImageVisual
                  src="https://dummyimage.com/512x512/242424/7BB2CE.png"
                  alt="Preview"
                />
                <ImageModal.ImageOptions>
                  <div className="flex items-end space-x-2">
                    <ImageModal.Filename value="Image">File name</ImageModal.Filename>
                    <ImageModal.Filetype selected="JPG" />
                  </div>

                  <ImageModal.ImageSize
                    width="512"
                    height="512"
                  >
                    Image size <span className="text-muted-foreground">px</span>
                  </ImageModal.ImageSize>

                  <ImageModal.SwitchOption defaultChecked>
                    Include annotations
                  </ImageModal.SwitchOption>
                  <ImageModal.SwitchOption defaultChecked>
                    Include warning message
                  </ImageModal.SwitchOption>
                </ImageModal.ImageOptions>
              </ImageModal.Body>
            </ImageModal>
          ),
          title: 'Image Dialog',
        })
      }
    >
      Open Image
    </Button>
  );
};

// ===== Dialog Components =====

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

export default function SettingsPage() {
  return (
    <ModalProvider modal={Modal}>
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col space-y-8">
          <div>
            <h2 className="mb-4 text-lg font-semibold">Modals</h2>
            <div className="flex space-x-2">
              <AboutButton />
              <PreferencesButton />
              <ImageButton />
            </div>
          </div>
          <div>
            <h2 className="mb-4 text-lg font-semibold">Dialogs</h2>
            <div className="flex space-x-2">
              <InputButton />
              <PresetButton />
            </div>
          </div>
        </div>
      </div>
    </ModalProvider>
  );
}
