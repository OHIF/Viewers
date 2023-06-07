import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import Select from '../Select';
import Typography from '../Typography';
import Button from '../Button';
import HotkeysPreferences from '../HotkeysPreferences';

const UserPreferences = ({
  availableLanguages,
  defaultLanguage,
  currentLanguage,
  disabled,
  hotkeyDefinitions,
  hotkeyDefaults,
  onCancel,
  onSubmit,
  onReset,
  hotkeysModule,
}) => {
  const { t } = useTranslation('UserPreferencesModal');
  const [state, setState] = useState({
    isDisabled: disabled,
    hotkeyErrors: {},
    hotkeyDefinitions,
    language: currentLanguage,
  });

  const onSubmitHandler = () => {
    onSubmit(state);
  };

  const onResetHandler = () => {
    setState(state => ({
      ...state,
      language: defaultLanguage,
      hotkeyDefinitions: hotkeyDefaults,
      hotkeyErrors: {},
      isDisabled: disabled,
    }));
    onReset();
  };

  const onCancelHandler = () => {
    setState({ hotkeyDefinitions });
    onCancel();
  };

  const onLanguageChangeHandler = value => {
    setState(state => ({ ...state, language: value }));
  };

  const onHotkeysChangeHandler = (id, definition, errors) => {
    setState(state => ({
      ...state,
      isDisabled: Object.values(errors).every(e => e !== undefined),
      hotkeyErrors: errors,
      hotkeyDefinitions: {
        ...state.hotkeyDefinitions,
        [id]: definition,
      },
    }));
  };

  const Section = ({ title, children }) => (
    <>
      <div className="border-b-2 border-black mb-2">
        <Typography
          variant="inherit"
          color="primaryLight"
          className="flex text-[16px] font-semibold pb-2 !leading-[1.2]"
        >
          {title}
        </Typography>
      </div>
      <div className="mt-4 mb-8">{children}</div>
    </>
  );

  return (
    <>
      <Section title={t('General')}>
        <div className="flex flex-row justify-center items-center w-72">
          <Typography variant="subtitle" className="mr-5 text-right h-full">
            {t('Language')}
          </Typography>
          <Select
            isClearable={false}
            onChange={onLanguageChangeHandler}
            options={availableLanguages}
            value={state.language}
          />
        </div>
      </Section>
      <Section title={t('Hotkeys')}>
        <HotkeysPreferences
          disabled={disabled}
          hotkeyDefinitions={state.hotkeyDefinitions}
          onChange={onHotkeysChangeHandler}
          errors={state.hotkeyErrors}
          hotkeysModule={hotkeysModule}
        />
      </Section>
      <div className="flex flex-row justify-between">
        <Button
          variant="outlined"
          border="light"
          onClick={onResetHandler}
          disabled={disabled}
        >
          {t('Reset to Defaults')}
        </Button>
        <div className="flex flex-row">
          <Button variant="outlined" border="light" onClick={onCancelHandler}>
            {t('Cancel')}
          </Button>
          <Button
            variant="contained"
            disabled={state.isDisabled}
            color="light"
            border="light"
            className="ml-2"
            onClick={onSubmitHandler}
          >
            {t('Save')}
          </Button>
        </div>
      </div>
    </>
  );
};

const noop = () => {};

UserPreferences.propTypes = {
  disabled: PropTypes.bool,
  hotkeyDefaults: PropTypes.object.isRequired,
  hotkeyDefinitions: PropTypes.object.isRequired,
  languageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
    })
  ),
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  onReset: PropTypes.func,
  hotkeysModule: PropTypes.shape({
    initialize: PropTypes.func.isRequired,
    pause: PropTypes.func.isRequired,
    unpause: PropTypes.func.isRequired,
    startRecording: PropTypes.func.isRequired,
    record: PropTypes.func.isRequired,
  }).isRequired,
};

UserPreferences.defaultProps = {
  languageOptions: [
    { value: 'ONE', label: 'ONE' },
    { value: 'TWO', label: 'TWO' },
  ],
  onCancel: noop,
  onSubmit: noop,
  onReset: noop,
  disabled: false,
};

export default UserPreferences;
