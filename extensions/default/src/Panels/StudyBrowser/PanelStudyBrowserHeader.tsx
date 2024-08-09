import React from 'react';
import { viewPresets, actionIcons } from './constants';
import { ToggleGroup, ToggleGroupItem } from '@ohif/ui-next';
import { Icon } from '@ohif/ui';
import { actionIcon, viewPreset } from './types';

function PanelStudyBrowserHeader({
  tab,
  getCloseIcon,
  viewPreset,
  setViewPreset,
}: {
  tab: any;
  getCloseIcon: () => JSX.Element;
  viewPreset: viewPreset;
  setViewPreset: (viewPreset: viewPreset) => void;
}) {
  return (
    <>
      <div className="bg-muted flex h-[40px] select-none rounded-t p-2">
        <div className={'flex h-[24px] w-full select-none justify-center self-center text-[14px]'}>
          <div className="flex w-full items-center justify-between">
            <div className="flex h-full items-center justify-center">
              <ToggleGroup
                type="single"
                value={viewPreset.id}
                onValueChange={value => {
                  const selectedViewPreset = viewPresets.find(preset => preset.id === value);
                  setViewPreset(selectedViewPreset);
                }}
              >
                {viewPresets.map((viewPreset: viewPreset, index) => (
                  <ToggleGroupItem
                    key={index}
                    aria-label={viewPreset.id}
                    value={viewPreset.id}
                    className="text-actions-primary"
                  >
                    <Icon name={viewPreset.iconName} />
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="text-muted-foreground flex items-center justify-center">
              {' '}
              <span>{tab.label}</span>{' '}
            </div>

            <div className="mr-[30px] flex items-center justify-center">
              <div className="flex items-center space-x-1">
                {actionIcons.map((icon: actionIcon, index) => (
                  <Icon
                    key={index}
                    name={icon.iconName}
                    onClick={e => {
                      icon.value = !icon.value;
                    }}
                    className={`cursor-pointer`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        {getCloseIcon()}
      </div>
    </>
  );
}

export { PanelStudyBrowserHeader };
