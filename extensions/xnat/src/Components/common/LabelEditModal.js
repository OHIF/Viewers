import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RoiLabelSelect from '../../elements/RoiLabelSelect/RoiLabelSelect';

function LabelEditModal(props) {
  const { labelTag, currentLabel, itemId, onUpdateProperty, onClose } = props;

  const [state, setState] = useState({
    newLabel: currentLabel,
    validLabel: true,
  });

  const onChangeLabel = label => {
    setState({
      ...state,
      newLabel: label,
      validLabel: label.length > 0 && label.length <= 64,
    });
  };

  const labelEntry = (
    <div style={{ marginBottom: 10 }}>
      <label>{labelTag}</label>
      <RoiLabelSelect
        value={state.newLabel}
        roiType={'AIM'}
        onChange={onChangeLabel}
      />
    </div>
  );

  return (
    <React.Fragment>
      <div>
        {labelEntry}
        <div style={{ marginBottom: 20 }} />
      </div>
      <div className="footer" style={{ justifyContent: 'flex-end' }}>
        <div>
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
              onUpdateProperty({
                newLabel: state.newLabel,
                itemId,
              });
              onClose();
            }}
            disabled={!state.validLabel}
          >
            Save
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}

LabelEditModal.propTypes = {
  labelTag: PropTypes.string,
  currentLabel: PropTypes.string,
  itemId: PropTypes.any,
  onUpdateProperty: PropTypes.func,
  onClose: PropTypes.func,
};

LabelEditModal.defaultProps = {
  labelTag: 'Label',
  currentLabel: undefined,
  itemId: undefined,
  onUpdateProperty: undefined,
  onClose: undefined,
};

export default LabelEditModal;
