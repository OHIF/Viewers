import React from 'react';
import { PanelSection, Icon } from '../../components';

const AdvancedToolbox = ({ title, items }) => {
  return (
    <PanelSection title={title}>
      <div className="bg-black flex flex-col">
        <div className="flex mt-0.5 flex-wrap bg-primary-dark py-2">
          {items?.map(item => {
            return (
              <div
                key={item.name}
                className="w-[40px] h-[40px] text-primary-active bg-black grid place-items-center hover:bg-primary-light hover:text-black hover:cursor-pointer rounded-md ml-2 mb-2"
              >
                <Icon name={item.icon} className="" />
              </div>
            );
          })}
        </div>
      </div>
      <div className="h-20 bg-green-300">active tool setting</div>
    </PanelSection>
  );
};

AdvancedToolbox.propTypes = {};

export default AdvancedToolbox;
