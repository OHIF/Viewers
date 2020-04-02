import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import { format } from 'date-fns';
import { Button, Icon, EmptyStudies } from '@ohif/ui';

const getGridColClass = (filtersMeta, name) => {
  const filter = filtersMeta.find((filter) => filter.name === name);
  return (filter && filter.gridCol && `w-${filter.gridCol}/24`) || '';
};

const StudyTableRow = (props) => {
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
    { 'border-b border-secondary-light': !isOpened },
  ];
  return (
    <>
      <tr>
        <td
          className={classnames('border-0 p-0', {
            'border-b border-secondary-light bg-primary-dark': isOpened,
          })}
        >
          <div
            className={classnames('w-full transition duration-300', {
              'border border-primary-light rounded overflow-hidden mb-2 hover:border-secondary-light': isOpened,
            })}
          >
            <table className={classnames('w-full p-4')}>
              <tbody>
                <tr
                  className={classnames(
                    'cursor-pointer hover:bg-secondary-main transition duration-300 bg-black',
                    {
                      'bg-primary-dark': !isOpened,
                    },
                    { 'bg-secondary-dark': isOpened }
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
                        'text-primary-active': isOpened,
                        'text-secondary-light': !isOpened,
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
                        <div className="ml-5 text-lg text-common-bright inline-flex items-center">
                          <Icon
                            name="notificationwarning-diamond"
                            className="mr-2 w-5 h-5"
                          />
                          Feedback text lorem ipsum dolor sit amet
                        </div>
                      </div>
                      <div className="mt-4">
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell size="normal">Description</TableCell>
                              <TableCell size="small">Series</TableCell>
                              <TableCell size="small">Modality</TableCell>
                              <TableCell size="normal">Instances</TableCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {series.map((seriesItem, i) => (
                              <TableRow key={i}>
                                <TableCell size="normal">
                                  Patient Protocol
                                </TableCell>
                                <TableCell size="small">
                                  {seriesItem.SeriesNumber}
                                </TableCell>
                                <TableCell size="small">
                                  {seriesItem.Modality}
                                </TableCell>
                                <TableCell size="normal">
                                  {seriesItem.instances.length}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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

StudyTableRow.propTypes = {
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
            <StudyTableRow
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
        <EmptyStudies />
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
