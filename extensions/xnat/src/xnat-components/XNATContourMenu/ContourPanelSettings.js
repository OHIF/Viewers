import React from 'react';
import PropTypes from 'prop-types';
import csTools from 'cornerstone-tools';
import { Icon, Range } from '@ohif/ui';
import refreshViewports from '../../utils/refreshViewports';
import SettingsSection from '../common/SettingsSection';

import '../common/XNATSettings.styl';

const modules = csTools.store.modules;

/**
 * @class ContourPanelSettings - A component that allows the user to change
 * configuration of the freehand3D tools.
 */
export default class ContourPanelSettings extends React.Component {
  static propTypes = {
    configuration: PropTypes.any,
    onChange: PropTypes.func,
    onBack: PropTypes.func,
  };

  static defaultProps = {
    configuration: undefined,
    onChange: undefined,
    onBack: undefined,
  };

  constructor(props = {}) {
    super(props);

    const { interpolate, displayStats } = modules.freehand3D.state;

    this.state = {
      interpolate,
      displayStats,
    };

    this.onDisplayStatsToggleClick = this.onDisplayStatsToggleClick.bind(this);
    this.onInterpolateToggleClick = this.onInterpolateToggleClick.bind(this);
    this.saveConfiguration = this.saveConfiguration.bind(this);
  }

  saveConfiguration = (field, value) => {
    this.props.onChange({ ...this.props.configuration, [field]: value });
  };

  /**
   * onDisplayStatsToggleClick - A Callback that toggles the display of stats
   * window on the Freehand3DTool.
   *
   * @returns {null}
   */
  onDisplayStatsToggleClick() {
    modules.freehand3D.setters.toggleDisplayStats();

    this.setState({ displayStats: modules.freehand3D.state.displayStats });

    refreshViewports();
  }

  /**
   * onInterpolateToggleClick - A callback that toggles interpolation mode for
   * the Freehand3DTool.
   *
   * @returns {null}
   */
  onInterpolateToggleClick() {
    modules.freehand3D.setters.toggleInterpolate();

    this.setState({ interpolate: modules.freehand3D.state.interpolate });
  }

  render() {
    const { interpolate, displayStats } = this.state;
    const { configuration, onBack } = this.props;

    const toFloat = value => {
      return parseFloat(value / 100).toFixed(2);
    }

    return (
      <div className="xnat-settings">
        <div className="settings-title">
          <h3>Contour ROI Settings</h3>
          <button className="return-button" onClick={onBack}>
            Back
          </button>
        </div>
        <SettingsSection>
          <div>
            <input
              type="checkbox"
              name="interpolate"
              onChange={this.onInterpolateToggleClick}
              checked={interpolate}
              value={interpolate}
            />
            <label htmlFor="interpolate"><em>Interpolate</em></label>
            <p>When turned on, drawing new 2D contours will produce intermediate contours estimated by linear interpolation.</p>
          </div>
        </SettingsSection>
        <SettingsSection>
          <div>
            <input
              type="checkbox"
              name="stats"
              onChange={this.onDisplayStatsToggleClick}
              checked={displayStats}
              value={displayStats}
            />
            <label htmlFor="stats"><em>Stats</em></label>
            <p>Toggles the display of ROI Contour statistics on the screen.</p>
          </div>
        </SettingsSection>
        <SettingsSection title="Contour Outline">
          <div className="range">
            <label htmlFor="range">Opacity</label>
            <Range
              showPercentage
              step={1}
              min={0}
              max={100}
              value={configuration.opacity * 100}
              onChange={event => this.saveConfiguration('opacity', toFloat(event.target.value))}
            />
          </div>
          <div className="range">
            <label htmlFor="range">Width</label>
            <Range
              showValue
              step={1}
              min={1}
              max={5}
              value={configuration.lineWidth}
              onChange={event => this.saveConfiguration('lineWidth', parseInt(event.target.value))}
            />
          </div>
        </SettingsSection>
      </div>
    );
  }
}
