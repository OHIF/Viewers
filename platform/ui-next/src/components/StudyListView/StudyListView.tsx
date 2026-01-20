import React from 'react';
import PropTypes from 'prop-types';
import { StudyCard } from '../StudyCard';
import { StudyListRichRow } from './StudyListRichRow';

const StudyListView = ({ studies, viewMode = 'grid', onStudyClick }) => {
  if (!studies || studies.length === 0) {
    return (
      <div className="text-info-muted flex h-full w-full items-center justify-center">
        No studies found
      </div>
    );
  }

  if (viewMode === 'grid') {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {studies.map((study, index) => (
          <StudyCard
            key={index}
            {...study}
            onClick={() => onStudyClick(study)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {studies.map((study, index) => (
        <StudyListRichRow
          key={index}
          {...study}
          onClick={() => onStudyClick(study)}
        />
      ))}
    </div>
  );
};

StudyListView.propTypes = {
  studies: PropTypes.arrayOf(PropTypes.object).isRequired,
  viewMode: PropTypes.oneOf(['grid', 'list']),
  onStudyClick: PropTypes.func,
};

export { StudyListView };
