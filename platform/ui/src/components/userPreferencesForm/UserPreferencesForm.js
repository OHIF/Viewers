import './UserPreferencesForm.styl';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from '../../utils/LanguageProvider';

import cloneDeep from 'lodash.clonedeep';
import isEqual from 'lodash.isequal';
import { UserPreferences } from './UserPreferences';

class UserPreferencesForm extends Component {
  // TODO: Make this component more generic to allow things other than W/L and hotkeys...
  static propTypes = {
    onClose: PropTypes.func,
    onSave: PropTypes.func,
    onResetToDefaults: PropTypes.func,
    windowLevelData: PropTypes.object,
    hotkeyDefinitions: PropTypes.arrayOf(
      PropTypes.shape({
        commandName: PropTypes.string,
        keys: PropTypes.arrayOf(PropTypes.string),
        label: PropTypes.string,
      })
    ).isRequired,
    generalPreferences: PropTypes.shape({
      language: PropTypes.string,
    }).isRequired,
    t: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      windowLevelData: cloneDeep(props.windowLevelData),
      hotkeyDefinitions: cloneDeep(props.hotkeyDefinitions),
      generalPreferences: cloneDeep(props.generalPreferences),
    };
  }

  save = () => {
    const {
      windowLevelData,
      hotkeyDefinitions,
      generalPreferences,
    } = this.state;

    this.props.onSave({
      windowLevelData,
      hotkeyDefinitions,
      generalPreferences,
    });
  };

  updatePropValue = (value, prop, key) => {
    this.setState({
      [prop]: {
        ...this.state[prop],
        [key]: value,
      },
    });
  };

  componentDidUpdate(prev, next) {
    const newStateData = {};

    if (!isEqual(prev.windowLevelData, next.windowLevelData)) {
      newStateData.windowLevelData = prev.windowLevelData;
    }

    if (!isEqual(prev.hotkeyDefinitions, next.hotkeyDefinitions)) {
      newStateData.hotkeyDefinitions = prev.hotkeyDefinitions;
    }

    if (!isEqual(prev.generalPreferences, next.generalPreferences)) {
      newStateData.generalPreferences = prev.generalPreferences;
    }

    const hasNewData = !(
      Object.entries(newStateData).length === 0 &&
      newStateData.constructor === Object
    );

    if (hasNewData) {
      this.setState(newStateData);
    }
  }

  render() {
    const {
      windowLevelData,
      hotkeyDefinitions,
      generalPreferences,
    } = this.state;
    const { t, onResetToDefaults, onClose } = this.props;

    return (
      <div className="UserPreferencesForm">
        <UserPreferences
          windowLevelData={windowLevelData}
          hotkeyDefinitions={hotkeyDefinitions}
          generalPreferences={generalPreferences}
          updatePropValue={this.updatePropValue}
        />
        <div className="footer">
          <button
            className="btn btn-danger pull-left"
            onClick={onResetToDefaults}
          >
            {t('Reset to Defaults')}
          </button>
          <div>
            <div onClick={onClose} className="btn btn-default">
              {t('Cancel')}
            </div>
            <button className="btn btn-primary" onClick={this.save}>
              {t('Save')}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const connectedComponent = withTranslation('UserPreferencesForm')(
  UserPreferencesForm
);
export { connectedComponent as UserPreferencesForm };
export default connectedComponent;
