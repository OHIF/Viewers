'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../Select';

const BackgroundColorSelect: React.FC = () => {
  const [selectedColor, setSelectedColor] = useState('#050615');

  useEffect(() => {
    const rows = document.querySelectorAll('.row') as NodeListOf<HTMLElement>;
    rows.forEach(row => {
      row.style.backgroundColor = selectedColor;
    });
  }, [selectedColor]);

  const handleColorChange = (value: string) => {
    setSelectedColor(value);
  };

  return (
    <div>
      <Select onValueChange={handleColorChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Color" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="black">Viewport (Black)</SelectItem>
          <SelectItem value="#050615">Base</SelectItem>
          <SelectItem value="#090C29">Medium</SelectItem>
          <SelectItem value="#041C4A">Header</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default BackgroundColorSelect;
