import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { SimpleDialog, TextInput, SelectTree } from '@ohif/ui';
import './MicroscopyLabelDialog.styl';
import ConfigPoint from 'config-point';

const MicroscopyLabelDialog = ({
  title,
  onSubmit,
  onClose,
  label,
  defaultValue = '',
}) => {
  const [value, setValue] = useState({ label: defaultValue });
  const onSubmitHandler = () => onSubmit(value);

  const labellingItemConfig = ConfigPoint.MicroscopyLabellingData;
  const { computedItems } = labellingItemConfig || {};
  const selectTreeSelectCallback = (event, item) => {
    setValue(item);
    onSubmit(item);
  };

  return (
    <div className="InputDialog MicroscopyLabelDialog">
      <SimpleDialog
        headerTitle={title}
        onClose={onClose}
        onConfirm={onSubmitHandler}
      >
        <TextInput
          type="text"
          value={value.label}
          onChange={event => setValue({ label: event.target.value })}
          label={label}
          autoComplete="off"
          autoFocus
          onFocus={e => e.currentTarget.select()}
        />
        {computedItems && (
          <SelectTree
            items={computedItems}
            columns={1}
            onSelected={selectTreeSelectCallback}
            selectTreeFirstTitle="Assign Label"
          />
        )}
      </SimpleDialog>
    </div>
  );
};

MicroscopyLabelDialog.propTypes = {
  title: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  label: PropTypes.string,
  defaultValue: PropTypes.string,
};

export default MicroscopyLabelDialog;
