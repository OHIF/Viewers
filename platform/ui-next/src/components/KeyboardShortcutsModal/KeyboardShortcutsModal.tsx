import React from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button } from '../../';

const KeyboardShortcutsModal = ({ hotkeysManager, onClose }) => {
  const { hotkeyDefinitions } = hotkeysManager;

  const hotkeys = Object.keys(hotkeyDefinitions).map(commandName => {
    const definition = hotkeyDefinitions[commandName];
    return {
      commandName,
      label: definition.label || commandName,
      keys: definition.keys,
    };
  });

  return (
    <div className="text-white">
      <div className="grid grid-cols-2 gap-4">
        {hotkeys.map((hotkey, index) => (
          <div
            key={index}
            className="flex items-center justify-between border-b border-gray-700 py-2"
          >
            <span className="text-sm">{hotkey.label}</span>
            <div className="flex gap-2">
              {hotkey.keys.map((key, keyIndex) => (
                <span
                  key={keyIndex}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1 font-mono text-xs"
                >
                  {key}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

KeyboardShortcutsModal.propTypes = {
  hotkeysManager: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};

export default KeyboardShortcutsModal;
