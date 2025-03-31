import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { GeneralAnatomyList } from '../../peppermint-tools';
import RoiLabelSelect from '../../elements/RoiLabelSelect/RoiLabelSelect';

const categories = GeneralAnatomyList.SegmentationCodes.Category;

function MaskRoiPropertyModal(props) {
  const {
    metadata,
    segmentIndex,
    onUpdateProperty,
    onClose,
  } = props;

  const [state, setState] = useState({
    segmentLabel: metadata.SegmentLabel,
    categoryUID: metadata.SegmentedPropertyCategoryCodeSequence.CodeValue,
    typeUID: metadata.SegmentedPropertyTypeCodeSequence.CodeValue,
    modifierUID: metadata.SegmentedPropertyTypeCodeSequence
      .SegmentedPropertyTypeModifierCodeSequence ?
      metadata.SegmentedPropertyTypeCodeSequence
        .SegmentedPropertyTypeModifierCodeSequence.CodeValue : null,
    validLabel: true,
  });

  const onCategoryChange = (evt) => {
    const categoryUID = evt.target.value;

    const category = categories.find(
      categoriesI => categoriesI.CodeValue === categoryUID
    );
    const firstType = category.Type[0];

    const typeUID = firstType.CodeValue;

    let modifierUID = null;

    if (firstType.Modifier) {
      modifierUID = firstType.Modifier[0].CodeValue;
    }

    setState({
      ...state,
      categoryUID,
      typeUID,
      modifierUID
    });
  }

  const onTypeChange = (evt) => {
    const { categoryUID } = state;
    const typeUID = evt.target.value;

    const category = categories.find(
      categoriesI => categoriesI.CodeValue === categoryUID
    );

    const types = category.Type;
    const type = types.find(typesI => typesI.CodeValue === typeUID);

    let modifierUID = null;

    if (type.Modifier) {
      modifierUID = type.Modifier[0].CodeValue;
    }

    setState({
      ...state,
      typeUID,
      modifierUID
    });
  }

  const onModifierChange = (evt) => {
    const modifierUID = evt.target.value;

    setState({
      ...state,
      modifierUID
    });
  }

  const onChangeSegmentLabel = label => {
    setState({
      ...state,
      segmentLabel: label,
      validLabel: label.length > 0 && label.length <= 64
    });
  }

  const categorySelect = (
    <div style={{ marginBottom: 10 }}>
      <label>Category</label>
      <select
        className="form-themed form-control input-overload"
        onChange={onCategoryChange}
        value={state.categoryUID}
      >
        {categories.map(category => (
          <option key={category.CodeValue} value={category.CodeValue}>
            {category.CodeMeaning}
          </option>
        ))}
      </select>
    </div>
  );

  const category = categories.find(
    categoriesI => categoriesI.CodeValue === state.categoryUID
  );
  const types = category.Type;

  const typeSelect = (
    <div style={{ marginBottom: 10 }}>
      <label>Type</label>
      <select
        className="form-themed form-control input-overload"
        onChange={onTypeChange}
        value={state.typeUID}
      >
        {types.map(type => (
          <option key={type.CodeValue} value={type.CodeValue}>
            {type.CodeMeaning}
          </option>
        ))}
      </select>
    </div>
  );

  const type = types.find(typesI => typesI.CodeValue === state.typeUID);

  let modifierSelect = null;

  if (type.Modifier) {
    const modifiers = type.Modifier;

    modifierSelect = (
      <div style={{ marginBottom: 10 }}>
        <label>Modifier</label>
        <select
          className="form-themed form-control input-overload"
          onChange={onModifierChange}
          value={state.modifierUID}
        >
          {modifiers.map(modifier => (
            <option key={modifier.CodeValue} value={modifier.CodeValue}>
              {modifier.CodeMeaning}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const segmentLabel = (
    <div style={{ marginBottom: 10 }}>
      <label>Label</label>
      <RoiLabelSelect
        value={state.segmentLabel}
        roiType={'SEG'}
        onChange={onChangeSegmentLabel}
      />
    </div>
  );

  return (
    <React.Fragment>
      <div>
        {segmentLabel}
        {categorySelect}
        {typeSelect}
        {modifierSelect}
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
                segmentLabel: state.segmentLabel,
                categoryUID: state.categoryUID,
                typeUID: state.typeUID,
                modifierUID: state.modifierUID,
                segmentIndex,
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

MaskRoiPropertyModal.propTypes = {
  metadata: PropTypes.object,
  segmentIndex: PropTypes.number,
  onUpdateProperty: PropTypes.func,
  onClose: PropTypes.func,
};

MaskRoiPropertyModal.defaultProps = {
  metadata: undefined,
  segmentIndex: undefined,
  onUpdateProperty: undefined,
  onClose: undefined,
};

export default MaskRoiPropertyModal;
