import React from 'react';
import PropTypes from 'prop-types';

import { TabComponents } from '@ohif/ui';

// Tabs
import { HotkeysPreferences } from './HotkeysPreferences';
import { WindowLevelPreferences } from './WindowLevelPreferences';
import { GeneralPreferences } from './GeneralPreferences';

const tabs = [
  {
    name: 'Hotkeys',
    Component: HotkeysPreferences,
  },
  {
    name: 'General',
    Component: GeneralPreferences,
  },
  {
    name: 'Window Level',
    Component: WindowLevelPreferences,
    hidden: true,
  },
];

function UserPreferences({ hide }) {
  const customProps = {
    onClose: hide,
  };
  return <TabComponents tabs={tabs} customProps={customProps} />;
}

UserPreferences.propTypes = {
  hide: PropTypes.func,
};

export { UserPreferences };
