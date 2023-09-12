import React from 'react';
import PropTypes from 'prop-types';

const StudySummary = ({ date, modality, description }) => {
  return (
    <div className="p-2">
      <div className="leading-none">
        <span className="mr-2 text-base text-white">{date}</span>
        <span className="bg-common-bright rounded-sm px-1 text-base font-bold text-black">
          {modality}
        </span>
      </div>
      <div className="text-primary-light ellipse truncate pt-2 text-base leading-none">
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
