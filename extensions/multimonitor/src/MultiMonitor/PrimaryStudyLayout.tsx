import React, { useState, useEffect, } from 'react';
import { utils } from '@ohif/core';

const { formatPN } = utils;


export default function MultiMonitorLayout(props) {
  const { studyData } = props;
  if (!studyData) return null;

  return (
    <div
      className='first:border-0 border-t border-secondary-light cursor-pointer select-none outline-none text-white ohif-scrollbar'
      style={{
        position: 'relative',
        width: '100%',
      }}
    >
      <div className="flex flex-1 flex-col px-4 pb-2 bg-secondary-dark">
        <h1>Primary Study</h1>
        <p>Acc#{studyData.AccessionNumber}  Modality: {studyData.ModalitiesInStudy} Date: {studyData.StudyDate} {studyData.StudyTime}</p>
        <p>{studyData?.StudyDescription}</p>
      </div>
      <div className="flex flex-1 flex-col px-4 pb-2 bg-secondary-dark">
        <h2>Launch Left Monitor</h2>
    <button>Basic Layout</button>
    <button>TMTV</button>
      </div>
  </div>);
}
