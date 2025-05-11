import React, { ReactElement } from 'react';
import { AllInOneMenu } from '@ohif/ui-next';
import { useTranslation } from 'react-i18next';
import { useWindowLevel } from '../../hooks/useWindowLevel';

export function WindowLevel({ viewportId }: { viewportId?: string } = {}): ReactElement {
  const { presets, setWindowLevelPreset } = useWindowLevel(viewportId);
  const { t } = useTranslation('WindowLevelActionMenu');

  return (
    <AllInOneMenu.ItemPanel>
      {presets.map((modalityPresets, modalityIndex) => (
        <React.Fragment key={modalityIndex}>
          {Object.entries(modalityPresets).map(([modality, presetsArray]) => (
            <React.Fragment key={modality}>
              <AllInOneMenu.HeaderItem>
                {t('Modality Presets', { modality })}
              </AllInOneMenu.HeaderItem>
              {presetsArray.map((preset, index) => (
                <AllInOneMenu.Item
                  key={`${modality}-${index}`}
                  label={preset.description}
                  secondaryLabel={`${preset.window} / ${preset.level}`}
                  useIconSpace={false}
                  onClick={() => setWindowLevelPreset(preset)}
                />
              ))}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </AllInOneMenu.ItemPanel>
  );
}
