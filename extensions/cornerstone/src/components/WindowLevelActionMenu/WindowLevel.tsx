import React, { ReactElement, useCallback } from 'react';
import { AllInOneMenu } from '@ohif/ui';
import { WindowLevelPreset } from '../../types/WindowLevel';
import { CommandsManager } from '@ohif/core';
import { useTranslation } from 'react-i18next';

export type WindowLevelProps = {
  viewportId: string;
  presets: Array<Record<string, Array<WindowLevelPreset>>>;
  commandsManager: CommandsManager;
};

export function WindowLevel({
  viewportId,
  commandsManager,
  presets,
}: WindowLevelProps): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');

  const onSetWindowLevel = useCallback(
    props => {
      commandsManager.run({
        commandName: 'setViewportWindowLevel',
        commandOptions: {
          ...props,
          viewportId,
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager, viewportId]
  );

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
                  onClick={() => onSetWindowLevel(preset)}
                />
              ))}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </AllInOneMenu.ItemPanel>
  );
}
