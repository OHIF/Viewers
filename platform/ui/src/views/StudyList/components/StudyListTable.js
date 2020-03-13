import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { format } from 'date-fns';
import { Button, Icon, Typography } from '@ohif/ui';

const getGridColClass = (filtersMeta, name) => {
  const filter = filtersMeta.find(filter => filter.name === name);
  return (filter && filter.gridCol && `w-${filter.gridCol}/24`) || '';
};

const TableRow = props => {
  const {
    AccessionNumber,
    Modalities,
    Instances,
    StudyDescription,
    PatientId,
    PatientName,
    StudyDate,
    series,
    filtersMeta,
  } = props;

  const [isOpened, setIsOpened] = useState(false);
  const toggleRow = () => setIsOpened(!isOpened);
  const ChevronIconName = isOpened ? 'chevron-down' : 'chevron-right';
  const tdClasses = [
    'px-4 py-2 text-base',
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
            className={classnames('w-full transition duration-300', {
              'border border-custom-aquaBright rounded overflow-hidden mb-2 hover:border-custom-violetPale': isOpened,
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
                  <td
                    className={classnames(
                      ...tdClasses,
                      getGridColClass(filtersMeta, 'patientName')
                    )}
                  >
                    <div className="flex flex-row items-center pl-1">
                      <Icon name={ChevronIconName} className="mr-4" />
                      {PatientName}
                    </div>
                  </td>
                  <td
                    className={classnames(
                      ...tdClasses,
                      getGridColClass(filtersMeta, 'mrn')
                    )}
                  >
                    {PatientId}
                  </td>
                  <td
                    className={classnames(
                      ...tdClasses,
                      getGridColClass(filtersMeta, 'studyDate')
                    )}
                  >
                    {format(StudyDate, 'MMM-DD-YYYY')}
                  </td>
                  <td
                    className={classnames(
                      ...tdClasses,
                      getGridColClass(filtersMeta, 'description')
                    )}
                  >
                    {StudyDescription}
                  </td>
                  <td
                    className={classnames(
                      ...tdClasses,
                      getGridColClass(filtersMeta, 'modality')
                    )}
                  >
                    {Modalities}
                  </td>
                  <td
                    className={classnames(
                      ...tdClasses,
                      getGridColClass(filtersMeta, 'accession')
                    )}
                  >
                    {AccessionNumber}
                  </td>
                  <td
                    className={classnames(
                      ...tdClasses,
                      getGridColClass(filtersMeta, 'instances')
                    )}
                  >
                    <Icon
                      name="series-active"
                      className={classnames('inline-flex mr-2', {
                        'text-custom-blueBright': isOpened,
                        'text-custom-violetPale': !isOpened,
                      })}
                    />
                    {Instances}
                  </td>
                </tr>
                {isOpened && (
                  <tr
                    className={classnames('bg-black max-h-0 overflow-hidden')}
                  >
                    <td colSpan="7" className="py-4 pl-12 pr-2">
                      <div className="block">
                        <Button
                          rounded="full"
                          variant="contained"
                          className="mr-4 font-bold"
                          endIcon={
                            <Icon
                              name="launch-arrow"
                              style={{ color: '#21a7c6' }}
                            />
                          }
                        >
                          Basic Viewer
                        </Button>
                        <Button
                          rounded="full"
                          variant="contained"
                          className="mr-4 font-bold"
                          endIcon={
                            <Icon
                              name="launch-arrow"
                              style={{ color: '#21a7c6' }}
                            />
                          }
                        >
                          Segmentation{' '}
                        </Button>
                        <Button
                          rounded="full"
                          variant="outlined"
                          endIcon={<Icon name="launch-info" />}
                          className="font-bold"
                        >
                          Module 3
                        </Button>
                        <div className="ml-5 text-lg text-custom-grayBright inline-flex items-center">
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
                              className={classnames(
                                seriesWidthClasses.normal,
                                'font-bold'
                              )}
                            >
                              Description
                            </div>
                            <div
                              className={classnames(
                                seriesWidthClasses.small,
                                'font-bold'
                              )}
                            >
                              Series
                            </div>
                            <div
                              className={classnames(
                                seriesWidthClasses.small,
                                'font-bold'
                              )}
                            >
                              Modality
                            </div>
                            <div
                              className={classnames(
                                seriesWidthClasses.normal,
                                'font-bold'
                              )}
                            >
                              Instances
                            </div>
                          </div>
                          <div className="mt-2 max-h-48 overflow-y-scroll ohif-scrollbar">
                            {series.map((seriesItem, i) => (
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
  AccessionNumber: PropTypes.string.isRequired,
  Modalities: PropTypes.string.isRequired,
  Instances: PropTypes.number.isRequired,
  PatientId: PropTypes.string.isRequired,
  PatientName: PropTypes.string.isRequired,
  StudyDescription: PropTypes.string.isRequired,
  StudyDate: PropTypes.string.isRequired,
  series: PropTypes.array.isRequired,
};

const StudyListTable = ({ studies, numOfStudies, filtersMeta }) => {
  const renderTable = () => {
    return (
      <table className="w-full text-white">
        <tbody>
          {studies.map((study, i) => (
            <TableRow
              key={i}
              AccessionNumber={study.AccessionNumber || ''}
              Modalities={study.Modalities || ''}
              Instances={study.Instances || ''}
              StudyDescription={study.StudyDescription || ''}
              PatientId={study.PatientId || ''}
              PatientName={study.PatientName || ''}
              StudyDate={study.StudyDate || ''}
              series={study.series || []}
              filtersMeta={filtersMeta}
            />
          ))}
        </tbody>
      </table>
    );
  };

  const renderEmpty = () => {
    return (
      <div className="flex flex-col items-center justify-center pt-48">
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
          {numOfStudies > 0 && renderTable()}
          {numOfStudies === 0 && renderEmpty()}
        </div>
      </div>
    </>
  );
};

StudyListTable.propTypes = {
  studies: PropTypes.arrayOf(
    PropTypes.shape({
      AccessionNumber: PropTypes.string.isRequired,
      Modalities: PropTypes.string.isRequired,
      Instances: PropTypes.number.isRequired,
      PatientId: PropTypes.string.isRequired,
      PatientName: PropTypes.string.isRequired,
      StudyDescription: PropTypes.string.isRequired,
      StudyDate: PropTypes.string.isRequired,
      series: PropTypes.array.isRequired,
    })
  ).isRequired,
  numOfStudies: PropTypes.number.isRequired,
};

export default StudyListTable;
