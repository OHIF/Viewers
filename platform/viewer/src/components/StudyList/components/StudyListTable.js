import React, { useState } from 'react';
import classnames from 'classnames';
import { Button } from '@ohif/ui';

/** TODO: Icons should be imported from @ohif/ui */
import ChevronRight from '../../../../../ui/src/assets/icons/chevron-right.svg';
import ChevronDown from '../../../../../ui/src/assets/icons/chevron-down.svg';
import InstancesActive from '../../../../../ui/src/assets/icons/instances-active.svg';
import InstancesInactive from '../../../../../ui/src/assets/icons/instances-inactive.svg';
import LaunchInfo from '../../../../../ui/src/assets/icons/launch-info.svg';

const TableRow = () => {
  const [isOpened, setIsOpened] = useState(false);
  const toggleRow = () => setIsOpened(!isOpened);
  const ChevronIcon = isOpened ? ChevronDown : ChevronRight;
  const InstancesIcon = isOpened ? InstancesActive : InstancesInactive;
  const tdClasses = [
    'px-4 py-2',
    { 'border-b border-custom-violetPale': !isOpened },
  ];
  const thClasses = [
    'px-2 py-1 text-base text-left border-r border-custom-navy',
  ];
  const tdSeries = [
    'px-2 py-1 text-base text-left border-r border-custom-violetPale',
  ];

  return (
    <>
      <tr>
        <td className="border-0 p-0">
          <div
            className={classnames('w-full', {
              'border border-custom-aquaBright rounded overflow-hidden': isOpened,
            })}
          >
            <table className={classnames('w-full p-4')}>
              <tbody>
                <tr
                  className={classnames(
                    'cursor-pointer hover:bg-custom-violetDark transition duration-300 ease-in-out',
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
                      'bg-custom-naxvyDark transition-all duration-300 ease-in-out overflow-hidden'
                    )}
                  >
                    <td colSpan="8" className="py-4 px-20">
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
                        <table className="table-fixed w-2/3">
                          <thead className="bg-custom-navy border-b border-custom-violetPale">
                            <tr>
                              <th className={classnames(...thClasses)}>
                                Description
                              </th>
                              <th className={classnames(...thClasses)}>
                                Series
                              </th>
                              <th className={classnames(...thClasses)}>
                                Modality
                              </th>
                              <th className={classnames(...thClasses)}>
                                Instances
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {new Array(10).fill('').map((el, i) => (
                              <tr key={i}>
                                <td
                                  className={classnames(...tdSeries, 'w-1/2')}
                                >
                                  Patient Protocol
                                </td>
                                <td
                                  className={classnames(...tdSeries, 'w-1/3')}
                                >
                                  #
                                </td>
                                <td className={classnames(...tdSeries)}>CT</td>
                                <td className={classnames(...tdSeries)}>149</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
