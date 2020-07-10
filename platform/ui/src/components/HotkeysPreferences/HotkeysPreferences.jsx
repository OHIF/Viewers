import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { HotkeyField, Typography } from '@ohif/ui';

import { MODIFIER_KEYS } from './hotkeysConfig';

/**
 * Take all hotkeys and split the list into two lists
 *
 * @param {array} hotkeys list of all hotkeys
 * @returns {array} array containing two arrays of keys
 */
const splitHotkeys = hotkeys => {
  const splitedHotkeys = [];

  if (hotkeys.length) {
    const halfwayThrough = Math.ceil(hotkeys.length / 2);
    splitedHotkeys.push(hotkeys.slice(0, halfwayThrough));
    splitedHotkeys.push(hotkeys.slice(halfwayThrough, hotkeys.length));
  }

  return splitedHotkeys;
};

const HotkeysPreferences = ({ hotkeys }) => {
  const [state, setState] = useState({ hotkeys, errors: {} });

  const hasHotkeys = Object.keys(state.hotkeys).length;
  const splitedHotkeys = splitHotkeys(state.hotkeys);

  if (!hasHotkeys) {
    return 'Hotkeys definitions is empty';
  }

  return (
    <div className="flex flex-row justify-center">
      {splitedHotkeys.map((hotkeys, index) => {
        return (
          <div key={index} className="flex flex-row mr-20">
            <div className="p-2 text-right flex flex-col">
              {hotkeys.map(({ commandName, keys, label }, hotkeyIndex) => {
                const error = state.errors[commandName];
                const onChangeHandler = keys => {
                  onHotkeyChanged(commandName, { keys, label }, keys);
                };

                const isFirst = hotkeyIndex === 0;

                return (
                  <div className="flex flex-row justify-end mb-2">
                    <div className="flex flex-col items-center">
                      {isFirst && (
                        <Typography variant="subtitle" className="pr-6 text-right text-primary-light">
                          Function
                        </Typography>
                      )}
                      <Typography
                        variant="subtitle"
                        className={
                          classNames(
                            "pr-6 h-full flex flex-row items-center",
                            isFirst && 'mt-5'
                          )}>
                        {label}
                      </Typography>
                    </div>
                    <div className="flex flex-col">
                      {isFirst && (
                        <Typography variant="subtitle" className="pr-6 pl-0 text-left text-primary-light">
                          Shortcut
                        </Typography>
                      )}
                      <div
                        className={
                          classNames(
                            'flex flex-col w-32',
                            isFirst && 'mt-5',
                            error && 'error'
                          )}>
                        <HotkeyField
                          keys={keys}
                          modifierKeys={MODIFIER_KEYS}
                          onChange={onChangeHandler}
                          className="text-lg h-8"
                        />
                        <span className="text-red">{error}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

HotkeysPreferences.propTypes = {
  onClose: PropTypes.func,
};

export default HotkeysPreferences;
