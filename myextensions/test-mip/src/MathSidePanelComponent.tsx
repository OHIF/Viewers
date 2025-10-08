import React, { useState } from 'react';

interface MIPProps {
  value: number;
  enabled: boolean;
  onValueChange: (value: number) => void;
  onToggle: (enabled: boolean) => void;
}

const MIP: React.FC<MIPProps> = ({ value, enabled, onValueChange, onToggle }) => {
  return (
    <div style={{ padding: 16 }}>
      <label>
        <input type="checkbox" checked={enabled} onChange={e => onToggle(e.target.checked)} />
        Enable MIP
      </label>
      <br />
      <label>
        MIP Value: {value}
        <input
          type="range"
          min={1}
          max={100}
          value={value}
          disabled={!enabled}
          onChange={e => onValueChange(Number(e.target.value))}
          style={{ width: '100%' }}
        />
      </label>
    </div>
  );
};

const MathSidePanelComponent: React.FC = () => {
  const [mipEnabled, setMipEnabled] = useState(false);
  const [mipValue, setMipValue] = useState(50);

  return (
    <MIP
      value={mipValue}
      enabled={mipEnabled}
      onValueChange={setMipValue}
      onToggle={setMipEnabled}
    />
  );
};

export default MathSidePanelComponent;
