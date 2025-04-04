import React, { useState } from 'react';
import { ChromePicker } from 'react-color';
import { FooterAction } from '@ohif/ui-next';

import './colorPickerDialog.css';

function ColorPickerDialog({ value, hide, onSave }) {
  const [color, setColor] = useState(value);

  const handleChange = color => {
    setColor(color.rgb);
  };

  return (
    <div>
      <ChromePicker
        color={color}
        onChange={handleChange}
        presetColors={[]}
        width={300}
      />
      <FooterAction>
        <FooterAction.Right>
          <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
          <FooterAction.Primary
            onClick={() => {
              hide();
              onSave(color);
            }}
          >
            Save
          </FooterAction.Primary>
        </FooterAction.Right>
      </FooterAction>
    </div>
  );
}

export default ColorPickerDialog;
