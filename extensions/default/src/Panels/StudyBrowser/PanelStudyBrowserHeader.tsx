import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@ohif/ui-next';
import { Icons } from '@ohif/ui-next';
import { actionIcon, viewPreset } from './types';

function PanelStudyBrowserHeader({
  viewPresets,
  updateViewPresetValue,
  actionIcons,
  updateActionIconValue,
}: {
  viewPresets: viewPreset[];
  updateViewPresetValue: (viewPreset: viewPreset) => void;
  actionIcons: actionIcon[];
  updateActionIconValue: (actionIcon: actionIcon) => void;
}) {
  return (
    <>
      <div className="bg-muted flex h-[40px] select-none rounded-t p-2">
        <div className={'flex h-[24px] w-full select-none justify-center self-center text-[14px]'}>
          <div className="flex w-full items-center gap-[10px]">
            <div className="flex items-center justify-center">
              <div className="text-primary flex items-center space-x-1">
                {actionIcons.map((icon: actionIcon, index) =>
                  React.createElement(Icons[icon.iconName] || Icons.MissingIcon, {
                    key: index,
                    onClick: () => updateActionIconValue(icon),
                    className: `cursor-pointer`,
                  })
                )}
              </div>
            </div>
            <div className="ml-auto flex h-full items-center justify-center">
              <ToggleGroup
                type="single"
                value={viewPresets.filter(preset => preset.selected)[0].id}
                onValueChange={value => {
                  const selectedViewPreset = viewPresets.find(preset => preset.id === value);
                  updateViewPresetValue(selectedViewPreset);
                }}
              >
                {viewPresets.map((viewPreset: viewPreset, index) => (
                  <ToggleGroupItem
                    key={index}
                    aria-label={viewPreset.id}
                    value={viewPreset.id}
                    className="text-actions-primary"
                  >
                    {React.createElement(Icons[viewPreset.iconName] || Icons.MissingIcon)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export { PanelStudyBrowserHeader };
