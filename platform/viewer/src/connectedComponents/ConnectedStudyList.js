import React from 'react';
import classnames from 'classnames';
import moment from 'moment';
import { StudyList } from '@ohif/ui';

// TEMPORARY MOCKING DATA FOR VISUALIZATION PURPOSES
import { utils, Icon } from '@ohif/ui';

const ConnectedStudyList = () => {
  const studies = utils.getMockedStudies();

  const tableDataSource = studies.map(study => {
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

    return {
      row: {
        patientName: (
          <>
            <Icon name={'chevron-right'} className="mr-4" />
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
                // 'text-custom-blueBright': isOpened,
                // 'text-custom-violetPale': !isOpened,
              })}
            />
            {Instances}
          </>
        ),
      },
      expandedContent: <div className="py-4 pl-12 pr-2">CONTENT HERE</div>,
    };
  });

  return (
    <StudyList
      perPage={25}
      tableDataSource={tableDataSource}
      studies={studies}
    />
  );
};

export default ConnectedStudyList;
