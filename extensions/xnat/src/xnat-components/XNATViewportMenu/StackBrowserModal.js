import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './StackBrowserModal.styl';

const StackBrowserModal = props => {
  const {
    selectedStackValue,
    stackInfoTree,
    onSetStackActive,
    onClose,
  } = props;

  const [id, setId] = useState(selectedStackValue);

  const onChange = evt => {
    const value = evt.target.value;
    setId(value);
  };

  return (
    <div className="StackBrowserModal">
      <div className="StackBrowserModalRow">
        <label>Select Stack</label>
        <select
          value={id}
          onChange={onChange}
          className="StackBrowserModalSelect"
        >
          {stackInfoTree.map((group, groupIndex) => {
            return (
              <optgroup key={groupIndex} label={group.label}>
                {group.stacks.map(option => {
                  return (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  );
                })}
              </optgroup>
            );
          })}
        </select>
      </div>
      <div className="footer">
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={onClose}
            data-cy="cancel-btn"
            className="btn btn-default"
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            data-cy="ok-btn"
            onClick={() => {
              onSetStackActive(id);
              onClose();
            }}
          >
            Set Active
          </button>
        </div>
      </div>
    </div>
  );
};

StackBrowserModal.propTypes = {
  selectedStackValue: PropTypes.string.isRequired,
  stackInfoTree: PropTypes.array.isRequired,
  onSetStackActive: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

StackBrowserModal.defaultProps = {};

export default StackBrowserModal;
