import React, { useState, useEffect } from 'react';
import classnames from 'classnames';

import { ButtonGroup, Button, StudyItem } from '@ohif/ui';

import { studyWithSR, studySimple, studyTracked } from './mockData';
const studyGroupTypes = ['Primary', 'Recent', 'All'];
const studyGroup = {
  Primary: [studyWithSR, studySimple],
  Recent: [studyWithSR, studyTracked],
  All: [studyWithSR, studySimple, studyTracked],
};

const buttonClasses = 'text-white border-none bg-black';
const activeButtonClasses = 'bg-primary-main';

const StudyBrowser = () => {
  const [studyGroupSelected, setStudyGroupSelected] = useState('Recent');
  const [studyActive, setStudyActive] = useState(null);

  useEffect(() => {
    setStudyActive(null);
  }, [studyGroupSelected]);

  return (
    <React.Fragment>
      <div className="flex flex-row items-center justify-center border-b-2 w-100 h-16 border-secondary-light p-4 bg-primary-dark">
        <ButtonGroup
          variant="outlined"
          color="inherit"
          className="border border-secondary-light rounded-md"
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
        {studyGroup[studyGroupSelected].map((data, index) => {
          const {
            studyInstanceUid,
            studyDate,
            studyDescription,
            instances,
            modalities,
            trackedSeries,
          } = data;
          return (
            <StudyItem
              key={index}
              studyDate={studyDate}
              studyDescription={studyDescription}
              instances={instances}
              modalities={modalities}
              trackedSeries={trackedSeries}
              isActive={studyActive === studyInstanceUid}
              onClick={() => {
                if (studyInstanceUid !== studyActive) {
                  setStudyActive(studyInstanceUid);
                } else {
                  setStudyActive(null);
                }
              }}
            />
          );
        })}
      </div>
    </React.Fragment>
  );
};

export default StudyBrowser;
