import React, { useId, useState } from 'react';
import { ChromePicker } from 'react-color';
import { FooterAction } from '@ohif/ui-next';

import './colorPickerDialog.css';

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b]
    .map(channel => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;

function ColorPickerDialog({ value, hide, onSave }) {
  const [color, setColor] = useState(value);
  const [hex, setHex] = useState(() => rgbToHex(value));
  const hexInputId = useId();

  const handleChange = nextColor => {
    setColor(nextColor.rgb);
    setHex(rgbToHex(nextColor.rgb));
  };

  const handleHexChange = event => {
    const nextHex = event.target.value;
    const normalizedHex = nextHex.replace(/^#/, '');
    setHex(nextHex);

    if (!/^[0-9a-f]{6}$/i.test(normalizedHex)) {
      return;
    }

    setColor(currentColor => ({
      ...currentColor,
      r: Number.parseInt(normalizedHex.slice(0, 2), 16),
      g: Number.parseInt(normalizedHex.slice(2, 4), 16),
      b: Number.parseInt(normalizedHex.slice(4, 6), 16),
    }));
  };

  return (
    <div data-cy="color-picker-dialog">
      <ChromePicker
        color={color}
        onChange={handleChange}
        presetColors={[]}
        width={300}
      />
      {color.a !== undefined && color.a !== 1 && (
        <div className="color-picker-hex-field">
          <input
            id={hexInputId}
            aria-label="hex"
            className="color-picker-hex-input"
            data-cy="color-picker-hex-input"
            value={hex}
            onChange={handleHexChange}
          />
          <label
            className="color-picker-hex-label"
            htmlFor={hexInputId}
          >
            Hex
          </label>
        </div>
      )}
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
