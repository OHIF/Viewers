import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { format } from 'date-fns';
import { Button, Icon, Typography } from '@ohif/ui';

/** TODO: Icon component should be used instead of importing the icons directly */
import ChevronRight from '../../../assets/icons/chevron-right.svg';
import ChevronDown from '../../../assets/icons/chevron-down.svg';
import InstancesActive from '../../../assets/icons/instances-active.svg';
import InstancesInactive from '../../../assets/icons/instances-inactive.svg';
import LaunchInfo from '../../../assets/icons/launch-info.svg';

const getStudyModalities = series => {
  const modalities = series.reduce((acc, item) => {
    const { Modality } = item;
    if (acc.includes(Modality)) {
      return acc;
    }

    acc.push(Modality);
    return acc;
  }, []);

  return modalities.join('/');
};

const getInstances = series => {
  const instances = series.reduce((acc, item) => {
    return acc + item.instances.length;
  }, 0);

  return instances;
};

const TableRow = ({ study }) => {
  const [isOpened, setIsOpened] = useState(false);
  const toggleRow = () => setIsOpened(!isOpened);
  const ChevronIcon = isOpened ? ChevronDown : ChevronRight;
  const InstancesIcon = isOpened ? InstancesActive : InstancesInactive;
  const tdClasses = [
    'px-4 py-2',
    { 'border-b border-custom-violetPale': !isOpened },
  ];
  const seriesWidthClasses = {
    normal: 'px-2 flex-1',
    small: 'px-2 flex-0.3',
  };
  const seriesBodyClasses = 'border-r border-custom-violetPale';
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
                    'cursor-pointer hover:bg-custom-violetDark transition duration-300 bg-black',
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
                  <td className={classnames(...tdClasses)}>
                    {study.PatientName}
                  </td>
                  <td className={classnames(...tdClasses)}>
                    {study.PatientId}
                  </td>
                  <td className={classnames(...tdClasses)}>
                    {format(study.StudyDate, 'MMM-DD-YYYY')}
                  </td>
                  <td className={classnames(...tdClasses)}>
                    {study.StudyDescription}
                  </td>
                  <td className={classnames(...tdClasses)}>
                    {getStudyModalities(study.series)}
                  </td>
                  <td className={classnames(...tdClasses)}>00000001</td>
                  <td className={classnames(...tdClasses)}>
                    <InstancesIcon className="inline-flex mr-2" />
                    {getInstances(study.series)}
                  </td>
                </tr>
                {isOpened && (
                  <tr className={classnames('bg-black')}>
                    <td colSpan="8" className="py-4 pl-20 pr-2">
                      <div className="flex">
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
                        <div className="ml-5 text-lg text-custom-grayBright flex items-center">
                          <Icon
                            name="notificationwarning-diamond"
                            className="mr-2 w-5 h-5"
                          />
                          Feedback text lorem ipsum dolor sit amet
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="w-full text-lg">
                          <div className="bg-custom-navy border-b border-custom-violetPale flex">
                            <div
                              className={classnames(seriesWidthClasses.normal)}
                            >
                              Description
                            </div>
                            <div
                              className={classnames(seriesWidthClasses.small)}
                            >
                              Series
                            </div>
                            <div
                              className={classnames(seriesWidthClasses.small)}
                            >
                              Modality
                            </div>
                            <div
                              className={classnames(seriesWidthClasses.normal)}
                            >
                              Instances
                            </div>
                          </div>
                          <div className="mt-2 h-48 overflow-y-scroll ohif-scrollbar">
                            {study.series.map((seriesItem, i) => (
                              <div className="w-full flex" key={i}>
                                <div
                                  className={classnames(
                                    seriesWidthClasses.normal,
                                    seriesBodyClasses
                                  )}
                                >
                                  Patient Protocol
                                </div>
                                <div
                                  className={classnames(
                                    seriesWidthClasses.small,
                                    seriesBodyClasses
                                  )}
                                >
                                  {seriesItem.SeriesNumber}
                                </div>
                                <div
                                  className={classnames(
                                    seriesWidthClasses.small,
                                    seriesBodyClasses
                                  )}
                                >
                                  {seriesItem.Modality}
                                </div>
                                <div className={classnames('pl-3 flex-1')}>
                                  {seriesItem.instances.length}
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

TableRow.propTypes = {
  study: PropTypes.object.isRequired,
};

const StudyListTable = ({ studies, totalStudies }) => {
  const renderTable = () => {
    return (
      <table className="w-full text-white">
        <tbody>
          {studies.map((study, i) => (
            <TableRow key={i} study={study} />
          ))}
        </tbody>
      </table>
    );
  };

  const renderEmpty = () => {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Icon name="magnifier" className="mb-4" />
        <Typography className="text-custom-aquaBright" variant="h5">
          No studies available
        </Typography>
      </div>
    );
  };

  return (
    <>
      <div className="bg-black">
        <div className="container m-auto relative">
          {totalStudies > 100 && (
            <div className="bg-custom-blue text-center text-base py-1 rounded-b sticky top-0">
              <p className="text-white">
                Filter list to 100 studies or less to enable sorting
              </p>
            </div>
          )}

          {totalStudies > 0 && renderTable()}
          {totalStudies === 0 && renderEmpty()}
        </div>
      </div>
    </>
  );
};

StudyListTable.propTypes = {
  studies: PropTypes.array.isRequired,
  totalStudies: PropTypes.number.isRequired,
};

export default StudyListTable;
