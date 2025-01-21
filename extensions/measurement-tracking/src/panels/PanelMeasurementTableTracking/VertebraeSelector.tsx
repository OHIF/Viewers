import React from 'react';
import PropTypes from 'prop-types';

const VertebraeSelector = ({ onSelect, selectedVertebraLevel }) => {
  const vertebraeLevels = ['T10', 'T11', 'T12', 'L1', 'L2', 'L3', 'L4', 'L5'];

  return (
    <div className="bg-primary-dark mt-2 rounded p-4">
      <div className="text-primary-active mb-2 text-[14px] font-semibold">
        请选择当前测量的椎体节段
      </div>
      <div className="grid grid-cols-3 gap-2">
        {vertebraeLevels.map(level => (
          <button
            key={level}
            onClick={() => onSelect(level)}
            className={`rounded p-2 text-[13px] ${
              selectedVertebraLevel === level
                ? 'bg-blue-500 text-white'
                : 'text-primary-light bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};
VertebraeSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,
  selectedVertebraLevel: PropTypes.string.isRequired,
};

export default VertebraeSelector;
