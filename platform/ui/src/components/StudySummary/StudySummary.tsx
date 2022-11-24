import React from 'react';
import PropTypes from 'prop-types';

const StudySummary = ({ date, modality, description }) => {
  return (
    <div className="p-2">
      <div className="leading-none">
        <span className="mr-2 text-base text-white">{date}</span>
        <span className="px-1 text-base font-bold text-black rounded-sm bg-common-bright">
          {modality}
        </span>
      </div>
      <div className="pt-2 text-base leading-none truncate text-primary-light ellipse">
        {description || ''}
      </div>
    </div>
  );
};

StudySummary.propTypes = {
  date: PropTypes.string.isRequired,
  modality: PropTypes.string.isRequired,
  description: PropTypes.string,
};

export default StudySummary;
