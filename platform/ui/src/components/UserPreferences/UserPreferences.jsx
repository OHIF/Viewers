import React from 'react';
import PropTypes from 'prop-types';
import { Select, Typography, Button, HotkeysPreferences } from '@ohif/ui';

const UserPreferences = ({ hotkeys, languageOptions, onCancel, onSubmit, onReset }) => {
  const Section = ({ title, children }) => (
    <>
      <div className="border-b-2 border-black mb-2">
        <Typography
          variant="h5"
          className="flex flex-grow text-primary-light font-light pb-2"
        >
          {title}
        </Typography>
      </div>
      <div className="mt-4 mb-8">
        {children}
      </div>
    </>
  );

  return (
    <div className="p-2">
      <Section title="General">
        <div className="flex flex-row justify-center items-center w-72">
          <Typography variant="subtitle" className="mr-5 text-right h-full">
            Language
          </Typography>
          <Select
            onChange={() => { }}
            options={languageOptions}
          />
        </div>
      </Section>
      <Section title="Hotkeys">
        <HotkeysPreferences hotkeys={hotkeys} />
      </Section>
      <div className="flex flex-row justify-between">
        <Button variant="outlined" onClick={onReset}>
          Restore Defaults
        </Button>
        <div>
          <Button variant="outlined" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="contained" color="light" className="ml-2" onClick={onSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

UserPreferences.propTypes = {
  hotkeys: PropTypes.arrayOf(PropTypes.object).isRequired,
  languageOptions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.any.isRequired,
    })
  ),
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired,
};

UserPreferences.defaultProps = {
  languageOptions: [
    { value: 'ONE', label: 'ONE' },
    { value: 'TWO', label: 'TWO' },
  ]
};

export default UserPreferences;
