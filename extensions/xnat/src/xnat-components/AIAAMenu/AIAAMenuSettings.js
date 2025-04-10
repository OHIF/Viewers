import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from '@ohif/ui';
import isValidUrl from '../../utils/isValidUrl.js';

import '../XNATRoiPanel.styl';

export default class AIAAMenuSettings extends React.Component {
  static propTypes = {
    settings: PropTypes.object,
    onSave: PropTypes.func,
  }

  static defaultProps = {
    settings: undefined,
    onSave: undefined,
  }

  constructor(props = {}) {
    super(props);

    const validUrl = isValidUrl(props.settings.serverUrl);

    this._settings = {
      ...props.settings
    };

    this.state = {
      validUrl: validUrl,
    };

    this.onBlurSeverURL = this.onBlurSeverURL.bind(this);
  }

  onBlurSeverURL = evt => {
    this._settings.serverUrl = evt.target.value;
    this.setState({
      validUrl: isValidUrl(evt.target.value),
    });
  }

  render() {
    const { settings } = this.props;
    const { validUrl } = this.state;

    return (
      <div className="footerSection">
        <div className="footerSectionItem">
          <label htmlFor="aiaaServerURL">AIAA server URL</label>
          <input
            id="aiaaServerURL"
            type="text"
            defaultValue={settings.serverUrl}
            onChange={this.onBlurSeverURL}
          />
        </div>
        <div className="footerSectionItem">
          <button
            onClick={() => {
              this.props.onSave(this._settings)}
            }
            disabled={!validUrl}
            style={{ marginLeft: 'auto' }}
          >
            Save
          </button>
        </div>
      </div>
    );
  }
}