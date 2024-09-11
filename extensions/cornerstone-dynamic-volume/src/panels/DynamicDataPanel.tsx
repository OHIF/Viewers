import React from 'react';
import PanelGenerateImage from './PanelGenerateImage';
import { Separator } from '@ohif/ui-next';

function DynamicDataPanel({
  servicesManager,
  commandsManager,
  renderHeader,
  getCloseIcon,
  tab,
}: withAppTypes) {
  return (
    <>
      {renderHeader && (
        <>
          <div className="bg-primary-dark flex select-none rounded-t pt-1.5 pb-[2px]">
            <div className="flex h-[24px] w-full cursor-pointer select-none justify-center self-center text-[14px]">
              <div className="text-primary-active flex grow cursor-pointer select-none justify-center self-center text-[13px]">
                <span>{tab.label}</span>
              </div>
            </div>

            {getCloseIcon()}
          </div>
          <Separator
            orientation="horizontal"
            className="bg-black"
            thickness="2px"
          />
        </>
      )}
      <div
        className="flex flex-col text-white"
        data-cy={'dynamic-volume-panel'}
      >
        <PanelGenerateImage
          commandsManager={commandsManager}
          servicesManager={servicesManager}
        ></PanelGenerateImage>
      </div>
    </>
  );
}

export default DynamicDataPanel;
