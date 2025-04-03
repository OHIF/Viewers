import React from 'react';
import { useEffect, useState } from 'react';

/**
 * A component that provides buttons to quickly switch between important hanging protocols
 * This is a direct UI solution when customization service approach doesn't work
 */
function PresetSwitcher({ servicesManager }) {
  const [selected, setSelected] = useState('');
  const { hangingProtocolService } = servicesManager.services;

  // Define the presets we want to offer
  const presets = [
    { id: 'mpr', label: 'MPR', icon: '📊' },
    { id: 'main3D', label: '3D', icon: '🧊' },
    { id: 'mprAnd3DVolumeViewport', label: 'MPR+3D', icon: '🔄' }
  ];

  useEffect(() => {
    // Track selected protocol
    const subscription = hangingProtocolService.subscribe(
      hangingProtocolService.EVENTS.PROTOCOL_CHANGED,
      ({ protocol }) => {
        if (protocol) {
          setSelected(protocol.id);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [hangingProtocolService]);

  // Function to apply a hanging protocol
  const applyPreset = (protocolId) => {
    try {
      hangingProtocolService.setProtocol(protocolId);
      console.log(`Applied preset: ${protocolId}`);
    } catch (error) {
      console.error(`Error applying preset ${protocolId}:`, error);
    }
  };

  const buttonStyle = {
    padding: '6px 10px',
    margin: '0 5px',
    borderRadius: '4px',
    border: '1px solid #0944b3',
    background: '#1e62eb',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
  };

  const selectedStyle = {
    ...buttonStyle,
    background: '#0944b3',
    fontWeight: 'bold'
  };

  const containerStyle = {
    display: 'flex',
    padding: '8px',
    background: '#000',
    justifyContent: 'center'
  };

  const iconStyle = {
    marginRight: '5px'
  };

  return (
    <div style={containerStyle}>
      {presets.map(preset => (
        <button
          key={preset.id}
          onClick={() => applyPreset(preset.id)}
          style={selected === preset.id ? selectedStyle : buttonStyle}
        >
          <span style={iconStyle}>{preset.icon}</span>
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export default PresetSwitcher; 