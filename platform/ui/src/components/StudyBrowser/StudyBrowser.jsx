import React, { useState } from 'react';
import classnames from 'classnames';

import { ButtonGroup, Button, StudyItem } from '@ohif/ui';

import mockData from './mockData';

const buttonClasses = 'text-white border-secondary-light bg-black';
const activeButtonClasses = 'bg-primary-main';

const studyGroupTypes = ['Primary', 'Recent', 'All'];

const StudyBrowser = () => {
  const [studyGroupSelected, setStudyGroupSelected] = useState('Recent');

  return (
    <React.Fragment>
      <div className="flex flex-row items-center justify-center border-b-2 w-100 h-16 border-secondary-light p-4">
        <ButtonGroup
          variant="outlined"
          rounded="small"
          color="inherit"
          size="medium"
        >
          {studyGroupTypes.map((studyGroup) => {
            const isActive = studyGroupSelected === studyGroup;
            return (
              <Button
                key={studyGroup}
                className={classnames(
                  buttonClasses,
                  isActive && activeButtonClasses
                )}
                onClick={() => setStudyGroupSelected(studyGroup)}
              >
                {studyGroup}
              </Button>
            );
          })}
        </ButtonGroup>
      </div>
      <div className="flex flex-col flex-1">
        {mockData.studies.map((data, index) => {
          return <StudyItem key={index} data={data} />;
        })}
      </div>
    </React.Fragment>
  );
};

export default StudyBrowser;
