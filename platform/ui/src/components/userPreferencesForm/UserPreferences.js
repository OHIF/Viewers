import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { HotKeysPreferences } from './HotKeysPreferences';
import { WindowLevelPreferences } from './WindowLevelPreferences';
import { GeneralPreferences } from './GeneralPreferences';
import './UserPreferences.styl';

export class UserPreferences extends Component {
  static defaultProps = {
    hotkeyDefinitions: [],
    windowLevelData: {},
    generalPreferences: {},
  };

  // TODO: Make this more generic. Tabs should not be restricted to these entries
  static propTypes = {
    hotkeyDefinitions: PropTypes.arrayOf(
      PropTypes.shape({
        commandName: PropTypes.string,
        keys: PropTypes.arrayOf(PropTypes.string),
        label: PropTypes.string,
      })
    ).isRequired,
    windowLevelData: PropTypes.object.isRequired,
    generalPreferences: PropTypes.object.isRequired,
    updatePropValue: PropTypes.func.isRequired,
  };

  state = {
    tabIndex: 0,
  };

  tabClick(tabIndex) {
    this.setState({ tabIndex });
  }

  renderHotkeysTab() {
    return (
      <form className="form-themed themed">
        <div className="form-content">
          <HotKeysPreferences
            hotkeyDefinitions={this.props.hotkeyDefinitions}
          />
        </div>
      </form>
    );
  }

  renderWindowLevelTab() {
    if (this.props.windowLevelData) {
      return (
        <form className="form-themed themed">
          <div className="form-content">
            <WindowLevelPreferences
              windowLevelData={this.props.windowLevelData}
            />
          </div>
        </form>
      );
    }
  }

  renderGeneralTab() {
    return (
      <form className="form-themed themed">
        <div className="form-content">
          <GeneralPreferences
            generalPreferences={this.props.generalPreferences}
            updatePropValue={this.props.updatePropValue}
          />
        </div>
      </form>
    );
  }

  renderTabs(tabIndex) {
    switch (tabIndex) {
      case 0:
        return this.renderHotkeysTab();
      /* case 1:
        return this.renderWindowLevelTab(); */
      case 2:
        return this.renderGeneralTab();

      default:
        break;
    }
  }

  getTabClass(tabIndex) {
    return tabIndex === this.state.tabIndex ? 'nav-link active' : 'nav-link';
  }

  render() {
    return (
      <div className="UserPreferences">
        <div className="UserPreferences__selector">
          <ul className="nav nav-tabs">
            <li
              onClick={() => {
                this.tabClick(0);
              }}
              className={this.getTabClass(0)}
            >
              <button>Hotkeys</button>
            </li>
            {false && (
              <li
                onClick={() => {
                  this.tabClick(1);
                }}
                className={this.getTabClass(1)}
              >
                <button>Window Level</button>
              </li>
            )}
            <li
              onClick={() => {
                this.tabClick(2);
              }}
              className={this.getTabClass(2)}
            >
              <button>General</button>
            </li>
          </ul>
        </div>
        {this.renderTabs(this.state.tabIndex)}
      </div>
    );
  }
}
