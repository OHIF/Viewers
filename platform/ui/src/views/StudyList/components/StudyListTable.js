import React, { useState } from 'react';
import classnames from 'classnames';
import { Button } from '@ohif/ui';

/** TODO: Icon component should be used instead of importing the icons directly */
import ChevronRight from '../../../assets/icons/chevron-right.svg';
import ChevronDown from '../../../assets/icons/chevron-down.svg';
import InstancesActive from '../../../assets/icons/instances-active.svg';
import InstancesInactive from '../../../assets/icons/instances-inactive.svg';
import LaunchInfo from '../../../assets/icons/launch-info.svg';

const TableRow = () => {
  const [isOpened, setIsOpened] = useState(false);
  const toggleRow = () => setIsOpened(!isOpened);
  const ChevronIcon = isOpened ? ChevronDown : ChevronRight;
  const InstancesIcon = isOpened ? InstancesActive : InstancesInactive;
  const tdClasses = [
    'px-4 py-2',
    { 'border-b border-custom-violetPale': !isOpened },
  ];
  return (
    <>
      <tr>
        <td
          className={classnames('border-0 p-0', {
            'border-b border-custom-violetPale bg-custom-navyDark': isOpened,
          })}
        >
          <div
            className={classnames('w-full', {
              'border border-custom-aquaBright rounded overflow-hidden mb-2': isOpened,
            })}
          >
            <table className={classnames('w-full p-4')}>
              <tbody>
                <tr
                  className={classnames(
                    'cursor-pointer hover:bg-custom-violetDark transition duration-300 ease-in-out bg-black',
                    {
                      'bg-custom-navyDark': !isOpened,
                    },
                    { 'bg-custom-navy': isOpened }
                  )}
                  onClick={toggleRow}
                >
                  <td className={classnames(...tdClasses)}>
                    <ChevronIcon />
                  </td>
                  <td className={classnames(...tdClasses)}>Patient name</td>
                  <td className={classnames(...tdClasses)}>11000002</td>
                  <td className={classnames(...tdClasses)}>
                    Mar-29-2013 11:26 AM
                  </td>
                  <td className={classnames(...tdClasses)}>
                    PET^1_PETCT_WB_AC (Adult)
                  </td>
                  <td className={classnames(...tdClasses)}>CT/OT/PT</td>
                  <td className={classnames(...tdClasses)}>00000001</td>
                  <td className={classnames(...tdClasses)}>
                    <InstancesIcon className="inline-flex mr-2" />
                    902
                  </td>
                </tr>
                {isOpened && (
                  <tr
                    className={classnames(
                      'bg-black transition-all duration-300 ease-in-out overflow-hidden'
                    )}
                  >
                    <td colSpan="8" className="py-4 pl-20 pr-2">
                      <div>
                        <Button
                          rounded="full"
                          variant="outlined"
                          endIcon={<LaunchInfo />}
                          className="mr-4"
                        >
                          Basic Viewer
                        </Button>
                        <Button
                          rounded="full"
                          variant="outlined"
                          endIcon={<LaunchInfo />}
                          className="mr-4"
                        >
                          Segmentation
                        </Button>
                        <Button
                          rounded="full"
                          variant="outlined"
                          endIcon={<LaunchInfo />}
                        >
                          Module 3
                        </Button>
                        <span className="ml-4 text-lg text-custom-grayBright">
                          Feedback text lorem ipsum dolor sit amet
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="w-full text-lg">
                          <div className="bg-custom-navy border-b border-custom-violetPale flex">
                            <div className="px-2 flex-1">Description</div>
                            <div className="px-2 flex-0.3">Series</div>
                            <div className="px-2 flex-0.3">Modality</div>
                            <div className="px-2 flex-1">Instances</div>
                          </div>
                          <div className="mt-2 h-48 overflow-y-scroll custom-scrollbar">
                            {new Array(30).fill('').map((el, i) => (
                              <div className="w-full flex" key={i}>
                                <div
                                  className={classnames(
                                    'border-r border-custom-violetPale px-2 flex-1'
                                  )}
                                >
                                  Patient Protocol
                                </div>
                                <div
                                  className={classnames(
                                    'border-r border-custom-violetPale px-2 flex-0.3'
                                  )}
                                >
                                  #
                                </div>
                                <div
                                  className={classnames(
                                    'border-r border-custom-violetPale px-2 flex-0.3'
                                  )}
                                >
                                  CT
                                </div>
                                <div
                                  className={classnames(
                                    'border-r border-transparent pl-3 flex-1'
                                  )}
                                >
                                  149
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </td>
      </tr>
    </>
  );
};

const StudyListTable = () => {
  return (
    <>
      <div className="bg-black">
        <div className="container m-auto relative">
          <div className="bg-custom-blue text-center text-base py-1 rounded-b sticky top-0">
            <p className="text-white">
              Filter list to 100 studies or less to enable sorting
            </p>
          </div>
          <table className="w-full text-white">
            <tbody>
              {new Array(30).fill('').map((empty, i) => (
                <TableRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default StudyListTable;
