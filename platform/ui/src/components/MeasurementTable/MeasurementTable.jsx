import React, { useState } from 'react';
import classnames from 'classnames';
import { Icon, ButtonGroup, Button, IconButton } from '@ohif/ui';

const MeasurementTable = () => {
  const tableData = new Array(12).fill('');
  const [activeItem, setActiveItem] = useState(null);

  const colorLUT = [
    '#932a13',
    '#821393',
    '#2b7fc4',
    '#12c457',
    '#7f7d2e',
    '#7f2e4a',
    '#866943',
    '#65ae7f',
    '#334b5f',
    '#3cb0dc',
    '#292ac9',
    '#629753',
  ];

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
        <div className="overflow-y-auto overflow-x-hidden ohif-scrollbar max-h-64">
          {!!data.length &&
            data.map((e, i) => {
              const itemKey = i;
              const currentItem = i + 1;
              const isActive = !!activeItem && activeItem[title] === i;
              return (
                <div
                  key={i}
                  className={classnames(
                    'group flex cursor-default bg-black border border-transparent transition duration-300 ',
                    {
                      'rounded overflow-hidden border-primary-light': isActive,
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
                      'text-center w-6 py-1 text-base transition duration-300',
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
          {!data.length && (
            <div
              className={classnames(
                'group flex cursor-default bg-black border border-transparent transition duration-300 '
              )}
            >
              <div
                className={classnames(
                  'text-center w-6 py-1 text-base transition duration-300 bg-primary-dark text-primary-light group-hover:bg-secondary-main'
                )}
              ></div>
              <div className="px-2 py-4 flex flex-1 items-center justify-between">
                <span className="text-base text-primary-light mb-1 flex items-center flex-1">
                  No tracked measurements
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSegments = (title, amount, data) => {
    return (
      <div>
        <div className="flex justify-between px-2 py-1 bg-secondary-main">
          <span className="text-base font-bold text-white tracking-widest uppercase">
            {title}
          </span>
          <div className="flex">
            <span className="text-base font-bold text-white">{amount}</span>
            <Icon
              name="eye-hidden"
              className="w-6 text-white ml-2 cursor-pointer transition duration-300 hover:opacity-80"
              onClick={() => alert('TBD')}
            />
          </div>
        </div>
        <div className="overflow-y-auto overflow-x-hidden ohif-scrollbar max-h-64">
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
                      'text-center w-6 py-1 text-base transition duration-300',
                      {
                        'bg-primary-light text-black': isActive,
                        'bg-primary-dark text-primary-light group-hover:bg-secondary-main': !isActive,
                      }
                    )}
                  >
                    {currentItem}
                  </div>
                  <div className="px-2 py-1 flex flex-1 items-center justify-between">
                    <span className="text-base text-primary-light mb-1 flex items-center flex-1">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: colorLUT[i] }}
                      ></div>
                      Label short description
                    </span>
                    <Icon
                      className={classnames(
                        'text-white w-6 cursor-pointer transition duration-300 hover:opacity-80'
                      )}
                      name="eye-visible"
                      onClick={(e) => {
                        // stopPropagation needed to avoid disable the current active item
                        e.stopPropagation();
                        alert('Toggle');
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
    <div className="overflow-y-auto overflow-x-hidden invisible-scrollbar pb-4">
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
      {renderTable('Measurements', null, [])}
      {renderTable('Measurements', 5, tableData)}
      {renderTable('ADDITIONAL FINDINGS', 5, tableData)}
      {renderSegments('SEGMENTS', 12, tableData)}

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
