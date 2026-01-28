import React, { ReactElement, useCallback, useEffect, useState } from 'react';
import { AllInOneMenu, Switch, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Numeric } from '@ohif/ui-next';
import { useSystem } from '@ohif/core';
import { useTranslation } from 'react-i18next';
import { Enums } from '@cornerstonejs/tools';

export function OrientationController({ viewportId }: { viewportId?: string }): ReactElement {
  const { t } = useTranslation('WindowLevelActionMenu');
  const { servicesManager, commandsManager } = useSystem();
  const { toolGroupService } = servicesManager.services;
  const [isEnabled, setIsEnabled] = useState(false);
  const [colorScheme, setColorScheme] = useState<'marker' | 'gray' | 'rgb'>('gray');
  const [letterColorScheme, setLetterColorScheme] = useState<'white' | 'mixed' | 'black'>('mixed');
  const [keepOrientationUp, setKeepOrientationUp] = useState(true);
  const [opacity, setOpacity] = useState(1.0);
  const toolGroupId = 'volume3d';

  useEffect(() => {
    const updateToolState = () => {
      const toolGroup = toolGroupService.getToolGroup(toolGroupId);
      if (!toolGroup || !toolGroup.hasTool('OrientationControllerTool')) {
        setIsEnabled(false);
        return;
      }

      const toolOptions = toolGroup.getToolOptions('OrientationControllerTool');
      const enabled = toolOptions?.mode === Enums.ToolModes.Enabled;
      setIsEnabled(enabled);

      // Get current configuration
      const config = toolGroup.getToolConfiguration('OrientationControllerTool') || {};
      if (config.colorScheme) {
        setColorScheme(config.colorScheme);
      }
      if (config.letterColorScheme !== undefined) {
        // Map old values to new values for backward compatibility
        const letterScheme = config.letterColorScheme;
        let mappedScheme: 'white' | 'mixed' | 'black';
        if (letterScheme === 'rgb') {
          mappedScheme = 'mixed';
        } else if (letterScheme === 'all-white') {
          mappedScheme = 'white';
        } else if (letterScheme === 'all-black') {
          mappedScheme = 'black';
        } else if (letterScheme === 'white' || letterScheme === 'mixed' || letterScheme === 'black') {
          mappedScheme = letterScheme;
        } else {
          mappedScheme = 'mixed'; // Default
        }
        setLetterColorScheme(mappedScheme);
      }
      if (config.keepOrientationUp !== undefined) {
        setKeepOrientationUp(config.keepOrientationUp);
      }
      if (config.opacity !== undefined) {
        setOpacity(config.opacity);
      }
    };

    updateToolState();
    const interval = setInterval(updateToolState, 500);
    return () => clearInterval(interval);
  }, [viewportId, toolGroupService, toolGroupId]);

  const onToggleChange = useCallback(
    (checked: boolean) => {
      commandsManager.runCommand('setToolEnabled', {
        toolName: 'OrientationControllerTool',
        toggle: true,
        toolGroupId: toolGroupId,
      });
      setIsEnabled(!isEnabled);
    },
    [commandsManager, toolGroupId, isEnabled]
  );

  const updateConfiguration = useCallback(
    (updates: { colorScheme?: string; letterColorScheme?: string; keepOrientationUp?: boolean; opacity?: number }) => {
      const toolGroup = toolGroupService.getToolGroup(toolGroupId);
      if (!toolGroup || !toolGroup.hasTool('OrientationControllerTool')) {
        return;
      }

      const currentConfig = toolGroup.getToolConfiguration('OrientationControllerTool') || {};
      const newConfig = { ...currentConfig, ...updates };
      toolGroup.setToolConfiguration('OrientationControllerTool', newConfig);

      // Trigger re-render by calling onSetToolConfiguration if tool is enabled
      if (isEnabled) {
        const toolInstance = toolGroup.getToolInstance('OrientationControllerTool');
        if (toolInstance && typeof toolInstance.onSetToolConfiguration === 'function') {
          toolInstance.onSetToolConfiguration();
        }
      }
    },
    [toolGroupService, toolGroupId, isEnabled]
  );

  const onColorSchemeChange = useCallback(
    (scheme: 'marker' | 'gray' | 'rgb') => {
      setColorScheme(scheme);
      updateConfiguration({ colorScheme: scheme });
    },
    [updateConfiguration]
  );

  const onLetterColorSchemeChange = useCallback(
    (scheme: 'white' | 'mixed' | 'black') => {
      setLetterColorScheme(scheme);
      updateConfiguration({ letterColorScheme: scheme });
    },
    [updateConfiguration]
  );

  const onKeepOrientationUpChange = useCallback(
    (checked: boolean) => {
      setKeepOrientationUp(checked);
      updateConfiguration({ keepOrientationUp: checked });
    },
    [updateConfiguration]
  );

  const onOpacityChange = useCallback(
    (value: number) => {
      setOpacity(value);
      updateConfiguration({ opacity: value });
    },
    [updateConfiguration]
  );

  return (
    <AllInOneMenu.ItemPanel>
      <div className="hover:bg-accent flex h-8 w-full flex-shrink-0 items-center px-2 text-base hover:rounded">
        <span className="flex-grow">{t('Enable')}</span>
        <Switch
          className="ml-2 flex-shrink-0"
          checked={isEnabled}
          onCheckedChange={onToggleChange}
        />
      </div>

      <div className="hover:bg-accent flex h-8 w-full flex-shrink-0 items-center px-2 text-base hover:rounded">
        <span className="flex-grow">{t('Keep Orientation Up')}</span>
        <Switch
          className="ml-2 flex-shrink-0"
          checked={keepOrientationUp}
          onCheckedChange={onKeepOrientationUpChange}
        />
      </div>

      <div className="bg-background mt-2 mb-1 h-px w-full"></div>

      <div className="mt-2 flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-start px-2 text-base">
        <div className="text-muted-foreground text-sm">{t('Color Scheme')}</div>
      </div>

      <div className="px-2 mb-2">
        <Select
          value={colorScheme}
          onValueChange={(value: 'marker' | 'gray' | 'rgb') => onColorSchemeChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="marker">{t('Marker')}</SelectItem>
            <SelectItem value="gray">{t('Gray')}</SelectItem>
            <SelectItem value="rgb">{t('RGB')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-background mt-2 mb-1 h-px w-full"></div>

      <div className="mt-2 flex h-8 !h-[20px] w-full flex-shrink-0 items-center justify-start px-2 text-base">
        <div className="text-muted-foreground text-sm">{t('Letter Colors')}</div>
      </div>

      <div className="px-2 mb-2">
        <Select
          key={`letter-color-${letterColorScheme}`}
          value={letterColorScheme}
          onValueChange={(value: 'white' | 'mixed' | 'black') => onLetterColorSchemeChange(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="white">{t('White')}</SelectItem>
            <SelectItem value="mixed">{t('Mixed')}</SelectItem>
            <SelectItem value="black">{t('Black')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-background mt-2 mb-1 h-px w-full"></div>

      <div className="w-full pl-2 pr-1">
        <Numeric.Container
          mode="singleRange"
          min={0}
          max={1}
          step={0.01}
          value={opacity}
          onChange={onOpacityChange}
        >
          <div className="flex flex-row items-center">
            <Numeric.Label className="w-16">{t('Opacity')}</Numeric.Label>
            <Numeric.SingleRange sliderClassName="mx-2 flex-grow" />
          </div>
        </Numeric.Container>
      </div>
    </AllInOneMenu.ItemPanel>
  );
}
