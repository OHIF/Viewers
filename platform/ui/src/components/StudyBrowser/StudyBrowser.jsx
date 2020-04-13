import React, { useState } from 'react';
import classnames from 'classnames';

import { ButtonGroup, Button, StudyItem, ThumbnailList } from '@ohif/ui';

import { studyWithSR, studySimple } from './mockData';
const studyGroupTypes = ['Primary', 'Recent', 'All'];
const studyGroup = {
  Primary: [studySimple],
  Recent: [studyWithSR, studySimple],
  All: [studySimple, studyWithSR],
};

const buttonClasses = 'text-white text-base border-none bg-black';
const activeButtonClasses = 'bg-primary-main';

const StudyBrowser = () => {
  const [studyGroupSelected, setStudyGroupSelected] = useState('Recent');
  const [studyActive, setStudyActive] = useState(null);

  return (
    <React.Fragment>
      <div className="flex flex-row items-center justify-center border-b w-100 h-16 border-secondary-light p-4 bg-primary-dark">
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
                size="small"
                onClick={() => {
                  setStudyGroupSelected(studyGroup);
                  setStudyActive(null);
                }}
              >
                {studyGroup}
              </Button>
            );
          })}
        </ButtonGroup>
      </div>
      <div className="flex flex-col flex-1 overflow-auto invisible-scrollbar">
        {studyGroup[studyGroupSelected].map(
          ({
            studyInstanceUid,
            studyDate,
            studyDescription,
            instances,
            modalities,
            trackedSeries,
            thumbnails,
          }) => {
            const isActive = studyActive === studyInstanceUid;
            return (
              <React.Fragment key={studyInstanceUid}>
                <StudyItem
                  studyDate={studyDate}
                  studyDescription={studyDescription}
                  instances={instances}
                  modalities={modalities}
                  trackedSeries={trackedSeries}
                  isActive={isActive}
                  onClick={() => {
                    setStudyActive(isActive ? null : studyInstanceUid);
                  }}
                />
                {isActive && thumbnails && (
                  <ThumbnailList thumbnails={thumbnails} />
                )}
              </React.Fragment>
            );
          }
        )}
      </div>
    </React.Fragment>
  );
};

export default StudyBrowser;
