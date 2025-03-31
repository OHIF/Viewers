import React, { useState } from 'react';
import PropTypes from 'prop-types';

import './StackBrowserModal.styl';

const DisplaySetGroupBrowserModal = props => {
  const {
    selectedDisplaySetUID,
    displaySetInfoList,
    onSetDisplaySetActive,
    onClose,
  } = props;

  const [id, setId] = useState(selectedDisplaySetUID);

  const onChange = evt => {
    const value = evt.target.value;
    setId(value);
  };

  return (
    <div className="StackBrowserModal">
      <div className="StackBrowserModalRow">
        <label>Select Enhanced Instance</label>
        <select
          value={id}
          onChange={onChange}
          className="StackBrowserModalSelect"
        >
          {displaySetInfoList.map((ds, dsIndex) => {
            return (
              <option key={ds.uid} value={ds.uid}>
                {ds.label}
              </option>
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
              onSetDisplaySetActive(id);
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

DisplaySetGroupBrowserModal.propTypes = {
  selectedDisplaySetUID: PropTypes.string.isRequired,
  displaySetInfoList: PropTypes.array.isRequired,
  onSetDisplaySetActive: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

DisplaySetGroupBrowserModal.defaultProps = {};

export default DisplaySetGroupBrowserModal;
