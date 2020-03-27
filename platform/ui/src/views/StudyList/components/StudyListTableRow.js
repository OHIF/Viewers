import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  Button,
  Icon,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@ohif/ui';

const getGridColClass = (filtersMeta, name) => {
  const filter = filtersMeta.find(filter => filter.name === name);
  return (filter && filter.gridCol && `w-${filter.gridCol}/24`) || '';
};

const StudyListTableRow = props => {
  const { study, filtersMeta } = props;
  const { row, expandedContent } = study;

  const [isOpened, setIsOpened] = useState(false);
  const toggleRow = () => setIsOpened(!isOpened);
  const tdClasses = [
    'px-4 py-2 text-base',
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
                  {Object.keys(row).map(cellKey => {
                    const content = row[cellKey];

                    return (
                      <td
                        key={cellKey}
                        className={classnames(
                          ...tdClasses,
                          getGridColClass(filtersMeta, cellKey)
                        )}
                      >
                        <div className="flex flex-row items-center pl-1">
                          {content}
                        </div>
                      </td>
                    );
                  })}
                  {/* <td
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
                    {StudyDate}
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
                  </td> */}
                </tr>
                {isOpened && (
                  <tr
                    className={classnames('bg-black max-h-0 overflow-hidden')}
                  >
                    {expandedContent}
                    {/* <td colSpan="7" className="py-4 pl-12 pr-2">
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
                    </td> */}
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

StudyListTableRow.propTypes = {
  AccessionNumber: PropTypes.string.isRequired,
  Modalities: PropTypes.string.isRequired,
  Instances: PropTypes.number.isRequired,
  PatientId: PropTypes.string.isRequired,
  PatientName: PropTypes.string.isRequired,
  StudyDescription: PropTypes.string.isRequired,
  StudyDate: PropTypes.string.isRequired,
  series: PropTypes.array.isRequired,
};

export default StudyListTableRow;
