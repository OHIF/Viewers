import React, { useState } from 'react';
import { ChromePicker } from 'react-color';
import { FooterAction } from '@ohif/ui-next';

import './colorPickerDialog.css';

function ColorPickerDialog({ value, hide, onSave }) {
  // ChromePicker hides its hex input (and blocks toggling back to it)
  // whenever the color's alpha is not exactly 1, so keep alpha out of the
  // picker entirely and return the caller's alpha untouched on save.
  const { a: alpha, ...rgbValue } = value ?? {};
  const [color, setColor] = useState(rgbValue);

  const handleChange = color => {
    const { a: _a, ...rgb } = color.rgb;
    setColor(rgb);
  };

  return (
    <div data-cy="color-picker-dialog">
      <ChromePicker
        color={color}
        onChange={handleChange}
        disableAlpha={true}
        presetColors={[]}
        width={300}
      />
      <FooterAction>
        <FooterAction.Right>
          <FooterAction.Secondary
            dataCY="color-picker-cancel-btn"
            onClick={hide}
          >
            Cancel
          </FooterAction.Secondary>
          <FooterAction.Primary
            dataCY="color-picker-save-btn"
            onClick={() => {
              hide();
              onSave({ ...color, a: alpha ?? 1 });
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
