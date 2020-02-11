import React from 'react';
import classnames from 'classnames';

import './StudyItem.styl';

function StudyItem({
  modality = 'CT',
  studyDate = '19-mar-2001',
  description = 'STUDY DESCRIPTION',
  active = false,
}) {
  return (
    <div className={classnames('StudyItem', active ? 'active' : '')}>
      <div className="studyModality">{modality}</div>
      <div>
        <div>{studyDate}</div>
        <div>{description}</div>
      </div>
    </div>
  );
}

export { StudyItem };
