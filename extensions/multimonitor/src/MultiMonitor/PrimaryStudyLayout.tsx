import React, { useState, useEffect, } from 'react';
import { utils } from '@ohif/core';

const { formatPN } = utils;

export default function MultiMonitorLayout(props) {
  const { studyData } = props;
  if (!studyData) return null;

  return (<div style={{ background: 'white', color: 'green', width: '100%' }}>

    <p><b>Study</b> {studyData.AccessionNumber}  Modality: {studyData.ModalitiesInStudy?.join(', ')} </p>
    <p>{studyData?.StudyDescription}</p>
    <h2>Both Monitor Launch</h2>
    <button>Basic Layout</button>
    <button>TMTV</button>
    <h2>Compare Mode Left</h2>
  </div>);
}
