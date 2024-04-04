import React, { ReactElement, useCallback } from 'react';
import { AllInOneMenu } from '@ohif/ui';
import { WindowLevelPreset } from '../../types/WindowLevel';
import { CommandsManager } from '@ohif/core';
import { useTranslation } from 'react-i18next';

export type WindowLevelProps = {
  viewportId: string;
  presets: Record<string, Array<WindowLevelPreset>>;
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
        },
        context: 'CORNERSTONE',
      });
    },
    [commandsManager]
  );

  return (
    <AllInOneMenu.ItemPanel>
      <AllInOneMenu.HeaderItem>
        {t('Modality Presets', { modality: Object.keys(presets)[0] })}
      </AllInOneMenu.HeaderItem>
      {Object.values(presets)[0].map((preset, index) => (
        <AllInOneMenu.Item
          key={index}
          label={preset.description}
          secondaryLabel={`${preset.window} / ${preset.level}`}
          onClick={() => onSetWindowLevel({ ...preset, viewportId })}
        ></AllInOneMenu.Item>
      ))}
    </AllInOneMenu.ItemPanel>
  );
}
