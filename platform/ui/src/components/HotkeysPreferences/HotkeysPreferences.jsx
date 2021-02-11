import React, { useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { HotkeyField, Typography } from '@ohif/ui';

/* TODO: Move these configs and utils to core? */
import { MODIFIER_KEYS } from './hotkeysConfig';
import { validate, splitHotkeyDefinitionsAndCreateTuples } from './utils';

const HotkeysPreferences = ({ disabled, hotkeyDefinitions, errors: controlledErrors, onChange }) => {
  const visibleHotkeys = Object.keys(hotkeyDefinitions)
    .filter(key => hotkeyDefinitions[key].isEditable)
    .reduce((obj, key) => {
      obj[key] = hotkeyDefinitions[key];
      return obj;
    }, {});

  const [errors, setErrors] = useState(controlledErrors);
  const splitedHotkeys = splitHotkeyDefinitionsAndCreateTuples(visibleHotkeys);

  if (!Object.keys(hotkeyDefinitions).length) {
    return 'No hotkey definitions';
  }

  const onHotkeyChangeHandler = (id, definition) => {
    const { error } = validate({
      commandName: id,
      pressedKeys: definition.keys,
      hotkeys: hotkeyDefinitions,
    });

    setErrors(prevState => {
      const errors = { ...prevState, [id]: error };
      onChange(id, definition, errors);
      return errors;
    });
  };

  return (
    <div className='flex flex-row justify-center'>
      <div className='flex flex-row justify-evenly w-full'>
        {splitedHotkeys.map((hotkeys, index) => {
          return (
            <div key={`HotkeyGroup@${index}`} className='flex flex-row'>
              <div className='p-2 text-right flex flex-col'>
                {hotkeys.map((hotkey, hotkeyIndex) => {
                  const [id, definition] = hotkey;
                  const isFirst = hotkeyIndex === 0;
                  const error = errors[id];

                  const onChangeHandler = keys => onHotkeyChangeHandler(id, { ...definition, keys });

                  return (
                    <div key={`HotkeyItem@${hotkeyIndex}`} className='flex flex-row justify-end mb-2'>
                      <div className='flex flex-col items-center'>
                        <Typography
                          variant='subtitle'
                          className={classNames('pr-6 w-full text-right text-primary-light', !isFirst && 'hidden')}
                        >
                          Function
                      </Typography>
                        <Typography
                          variant='subtitle'
                          className={classNames('pr-6 h-full flex flex-row items-center whitespace-no-wrap', isFirst && 'mt-5')}>
                          {definition.label}
                        </Typography>
                      </div>
                      <div className='flex flex-col'>
                        <Typography
                          variant='subtitle'
                          className={classNames('pr-6 pl-0 text-left text-primary-light', !isFirst && 'hidden')}
                        >
                          Shortcut
                      </Typography>
                        <div className={classNames('flex flex-col w-32', isFirst && 'mt-5')}>
                          <HotkeyField
                            disabled={disabled}
                            keys={definition.keys}
                            modifierKeys={MODIFIER_KEYS}
                            onChange={onChangeHandler}
                            className='text-lg h-8'
                          />
                          {error && <span className='p-2 text-red-600 text-sm'>{error}</span>}
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
    </div>
  );
};

const noop = () => { };

HotkeysPreferences.propTypes = {
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  hotkeyDefinitions: PropTypes.object.isRequired,
};

HotkeysPreferences.defaultProps = {
  onChange: noop,
  disabled: false
};

export default HotkeysPreferences;
