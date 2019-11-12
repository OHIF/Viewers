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
    hotkeyDefinitions: PropTypes.array,
    t: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.state = {
      windowLevelData: cloneDeep(props.windowLevelData),
      hotkeyDefinitions: cloneDeep(props.hotkeyDefinitions),
    };
  }

  save = () => {
    this.props.onSave({
      windowLevelData: this.state.windowLevelData,
      hotkeyDefinitions: this.state.hotkeyDefinitions,
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

    if (newStateData.hotkeyDefinitions || newStateData.windowLevelData) {
      this.setState(newStateData);
    }
  }

  render() {
    return (
      <div className="UserPreferencesForm">
        <UserPreferences
          windowLevelData={this.state.windowLevelData}
          hotkeyDefinitions={this.state.hotkeyDefinitions}
        />
        <div className="footer">
          <button
            className="btn btn-danger pull-left"
            onClick={this.props.onResetToDefaults}
          >
            {this.props.t('Reset to Defaults')}
          </button>
          <div>
            <div onClick={this.props.onClose} className="btn btn-default">
              {this.props.t('Cancel')}
            </div>
            <button className="btn btn-primary" onClick={this.save}>
              {this.props.t('Save')}
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
