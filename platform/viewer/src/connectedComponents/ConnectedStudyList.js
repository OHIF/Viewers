import React, { useState } from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { StudyList } from '@ohif/ui';

// TEMPORARY MOCKING DATA FOR VISUALIZATION PURPOSES
import { utils, Icon, StudyListExpandedRow, Button } from '@ohif/ui';

const ConnectedStudyList = () => {
  const studies = utils.getMockedStudies();
  const numOfStudies = studies.length;

  const tableDataSource = studies.map(study => {
    const [isExpanded, setIsExpanded] = useState(false);
    const {
      AccessionNumber,
      Modalities,
      Instances,
      StudyDescription,
      PatientId,
      PatientName,
      StudyDate,
      series,
    } = study;

    const seriesTableColumns = {
      description: 'Description',
      seriesNumber: 'Series',
      modality: 'Modality',
      Instances: 'Instances',
    };

    const seriesTableDataSource = series.map(seriesItem => {
      const { SeriesNumber, Modality, instances } = seriesItem;
      return {
        description: 'Patient Protocol',
        seriesNumber: SeriesNumber,
        modality: Modality,
        Instances: instances.length,
      };
    });

    return {
      row: {
        patientName: (
          <>
            <Icon
              name={isExpanded ? 'chevron-down' : 'chevron-right'}
              className="mr-4"
            />
            {PatientName}
          </>
        ),
        mrn: PatientId,
        studyDate: (
          <div>
            <span className="mr-4">
              {moment(StudyDate).format('MMM-DD-YYYY')}
            </span>
            <span>{moment(StudyDate).format('hh:mm A')}</span>
          </div>
        ),
        description: StudyDescription,
        modality: Modalities,
        accession: AccessionNumber,
        instances: (
          <>
            <Icon
              name="series-active"
              className={classnames('inline-flex mr-2', {
                'text-custom-blueBright': isExpanded,
                'text-custom-violetPale': !isExpanded,
              })}
            />
            {Instances}
          </>
        ),
      },
      expandedContent: (
        <StudyListExpandedRow
          seriesTableColumns={seriesTableColumns}
          seriesTableDataSource={seriesTableDataSource}
        >
          <Button
            rounded="full"
            variant="contained"
            className="mr-4 font-bold"
            endIcon={<Icon name="launch-arrow" style={{ color: '#21a7c6' }} />}
          >
            Basic Viewer
          </Button>
          <Button
            rounded="full"
            variant="contained"
            className="mr-4 font-bold"
            endIcon={<Icon name="launch-arrow" style={{ color: '#21a7c6' }} />}
          >
            Segmentation
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
            <Icon name="notificationwarning-diamond" className="mr-2 w-5 h-5" />
            Feedback text lorem ipsum dolor sit amet
          </div>
        </StudyListExpandedRow>
      ),
      onClickRow: () => setIsExpanded(s => !s),
      isExpanded,
    };
  });

  const [currentPage, setCurrentPage] = useState(1);

  const paginationData = {
    onChangePage: page => setCurrentPage(page),
    currentPage,
  };

  return (
    <StudyList
      tableDataSource={tableDataSource.slice(0, 25)}
      numOfStudies={numOfStudies}
      paginationData={paginationData}
    />
  );
};

export default ConnectedStudyList;
