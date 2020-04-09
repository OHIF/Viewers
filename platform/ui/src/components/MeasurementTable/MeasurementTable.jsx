import React, { useState } from 'react';
import classnames from 'classnames';
import { Icon, ButtonGroup, Button, IconButton } from '@ohif/ui';

const MeasurementTable = () => {
  const tableData = new Array(5).fill('');
  const [activeItem, setActiveItem] = useState(null);

  const renderTable = (title, amount, data) => {
    return (
      <div>
        <div className="flex justify-between px-2 py-1 bg-secondary-main">
          <span className="text-base font-bold text-white tracking-widest uppercase">
            {title}
          </span>
          <span className="text-base font-bold text-white">{amount}</span>
        </div>
        {/* MEASUREMENT ITEMS */}
        <div>
          {!!data.length &&
            data.map((e, i) => {
              const itemKey = i;
              const currentItem = i + 1;
              const isActive = !!activeItem && activeItem[title] === i;
              return (
                <div
                  key={i}
                  className={classnames(
                    'group flex cursor-default bg-black border border-transparent transition duration-300 rounded overflow-hidden',
                    {
                      'border-primary-light': isActive,
                    }
                  )}
                  onClick={() => {
                    setActiveItem((s) => {
                      return {
                        ...s,
                        [title]: s && s[title] === itemKey ? null : itemKey,
                      };
                    });
                  }}
                >
                  <div
                    className={classnames(
                      'p-2 text-base transition duration-300',
                      {
                        'bg-primary-light text-black': isActive,
                        'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
                      }
                    )}
                  >
                    {currentItem}
                  </div>
                  <div className="px-2 py-1 flex flex-1 flex-col relative">
                    <span className="text-base text-primary-light mb-1">
                      Label short description
                    </span>
                    <span className="pl-2 border-l border-primary-light text-base text-white">
                      24.0 x 24.0 mm (S:4, I:22)
                    </span>
                    <Icon
                      className={classnames(
                        'text-white w-4 absolute cursor-pointer transition duration-300',
                        {
                          'invisible opacity-0 mr-2': !isActive,
                        }
                      )}
                      name="pencil"
                      style={{
                        top: 4,
                        right: 4,
                        transform: isActive ? '' : 'translateX(100%)',
                      }}
                      onClick={(e) => {
                        // stopPropagation needed to avoid disable the current active item
                        e.stopPropagation();
                        alert('Edit');
                      }}
                    />
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* HEADER */}
      <div className="p-2">
        <div className="leading-none">
          <span className="text-white text-base mr-2">07-Sep-2010</span>
          <span className="px-1 text-black bg-common-bright text-base rounded-sm font-bold">
            CT
          </span>
        </div>
        <div className="leading-none">
          <span className="text-base text-primary-light">
            CHEST/ABD/PELVIS W CONTRAST
          </span>
        </div>
      </div>
      {/* TABLE */}
      {renderTable('Measurements', 5, tableData)}
      {renderTable('ADDITIONAL FINDINGS', 5, tableData)}

      {/* BUTTONS */}
      <div className="mt-4 flex justify-center">
        <ButtonGroup onClick={() => alert('Export')}>
          <Button
            className="text-white border-primary-main bg-black text-base py-2 px-2"
            size="initial"
            color="inherit"
          >
            Export
          </Button>
          <IconButton
            className="bg-black border-primary-main px-2 text-white px-2"
            color="inherit"
            size="initial"
          >
            <Icon name="arrow-down" />
          </IconButton>
        </ButtonGroup>
        <Button
          className="text-white border border-primary-main bg-black text-base py-2 px-2 ml-2"
          variant="outlined"
          size="initial"
          color="inherit"
          onClick={() => alert('Create Report')}
        >
          Create Report
        </Button>
      </div>
    </div>
  );
};

export default MeasurementTable;
