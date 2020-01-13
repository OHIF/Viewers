import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useSnackbarContext } from '@ohif/ui';

import './UserPreferencesForm.styl';

import { useTranslation } from 'react-i18next';

// Tabs Component wrapper
import { UserPreferencesTabs } from './UserPreferencesTabs';

// Tabs
import { HotKeysPreferences } from './HotKeysPreferences';
import { WindowLevelPreferences } from './WindowLevelPreferences';
import { GeneralPreferences } from './GeneralPreferences';

/**
 @typedef TabObject
 @type {Object}
 @property {string} name Name for given tab
 @property {ReactComponent} Component React component for given tab.
 @property {object} props Props State for given tab component
 @property {boolean} [hidden] To hidden tab or not
 */

/**
 * Main form component to render preferences tabs and buttons
 * @param {object} props component props
 * @param {string} props.name Tab`s name
 * @param {object} props.hotkeyDefinitions Hotkeys Data
 * @param {object} props.windowLevelData Window level data
 * @param {function} props.onSave Callback function when saving
 * @param {function} props.onClose Callback function when closing
 * @param {function} props.onResetToDefaults Callback function when resetting
 */
function UserPreferencesForm({
  onClose,
  onSave,
  onResetToDefaults,
  windowLevelData,
  generalPreferences,
  defaultLanguage,
  hotkeyDefaults,
  hotkeyDefinitions,
  hotkeyRecord,
}) {
  const tabs = [
    {
      name: 'Hotkeys',
      Component: HotKeysPreferences,
      props: {},
    },
    {
      name: 'General',
      Component: GeneralPreferences,
      props: {},
    },
    {
      name: 'Window Level',
      Component: WindowLevelPreferences,
      props: {},
      hidden: true,
    },
  ];
  const [tabsState, setTabsState] = useState({
    Hotkeys: { hotkeyDefinitions, hotkeyRecord },
    'Window Level': { windowLevelData },
    General: { generalPreferences },
  });
  const [tabsError, setTabsError] = useState(
    tabs.reduce((acc, tab) => {
      acc[tab.name] = false;
      return acc;
    }, {})
  );

  const snackbar = useSnackbarContext();

  const { t, ready: translationsAreReady } = useTranslation(
    'UserPreferencesModal'
  );

  const onTabStateChanged = (tabName, newState) => {
    setTabsState({ ...tabsState, [tabName]: newState });
  };

  const onTabErrorChanged = (tabName, hasError) => {
    setTabsError({ ...tabsError, [tabName]: hasError });
  };

  const hasAnyError = () => {
    return Object.values(tabsError).reduce((acc, value) => acc || value);
  };

  const onResetPreferences = () => {
    const defaultHotKeyDefinitions = {};

    hotkeyDefaults.map(item => {
      const { commandName, ...values } = item;
      defaultHotKeyDefinitions[commandName] = { ...values };
    });

    // Reset local state
    setTabsState({
      ...tabsState,
      Hotkeys: { hotkeyDefinitions: defaultHotKeyDefinitions, hotkeyRecord },
      General: { generalPreferences: { language: defaultLanguage } },
    });

    // reset errors
    setTabsError(
      tabs.reduce((acc, tab) => {
        acc[tab.name] = false;
        return acc;
      }, {})
    );

    snackbar.show({
      message: (
        <div dangerouslySetInnerHTML={{ __html: t('ResetDefaultMessage') }} />
      ),
      type: 'info',
    });

    if (
      onResetToDefaults &&
      {}.toString.call(onResetToDefaults) === '[object Function]'
    ) {
      onResetToDefaults();
    }
  };

  const onSavePreferences = event => {
    const toSave = Object.values(tabsState).reduce((acc, tabState) => {
      return { ...acc, ...tabState };
    }, {});

    onSave(toSave);
    snackbar.show({
      message: t('SaveMessage'),
      type: 'success',
    });
  };

  return translationsAreReady ? (
    <div className="UserPreferencesForm">
      <UserPreferencesTabs
        tabs={tabs}
        tabsState={tabsState}
        tabsError={tabsError}
        onTabStateChanged={onTabStateChanged}
        onTabErrorChanged={onTabErrorChanged}
      />
      <div className="footer">
        <button
          className="btn btn-danger pull-left"
          data-cy="reset-default-btn"
          onClick={onResetPreferences}
        >
          {t('Reset to Defaults')}
        </button>
        <div>
          <div
            onClick={onClose}
            data-cy="cancel-btn"
            className="btn btn-default"
          >
            {t('Cancel')}
          </div>
          <button
            className="btn btn-primary"
            data-cy="save-btn"
            disabled={hasAnyError()}
            onClick={onSavePreferences}
          >
            {t('Save')}
          </button>
        </div>
      </div>
    </div>
  ) : null;
}

UserPreferencesForm.propTypes = {
  onClose: PropTypes.func,
  onSave: PropTypes.func,
  onResetToDefaults: PropTypes.func,
  windowLevelData: PropTypes.object,
  hotkeyDefinitions: PropTypes.object,
  generalPreferences: PropTypes.object,
  defaultLanguage: PropTypes.string,
  hotkeyDefaults: PropTypes.array,
  hotkeyRecord: PropTypes.func,
};

export { UserPreferencesForm };
