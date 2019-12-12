import './CineDialog.styl';

import React, { PureComponent } from 'react';
import { withTranslation } from '../../contextProviders';
import { Icon } from './../../elements/Icon';
import PropTypes from 'prop-types';

class CineDialog extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      cineFrameRate: props.cineFrameRate,
      isPlaying: props.isPlaying,
    };
  }

  static propTypes = {
    /** Minimum value for range slider */
    cineMinFrameRate: PropTypes.number.isRequired,
    /** Maximum value for range slider */
    cineMaxFrameRate: PropTypes.number.isRequired,
    /** Increment range slider can "step" in either direction. */
    cineStepFrameRate: PropTypes.number.isRequired,
    cineFrameRate: PropTypes.number.isRequired,
    /** 'True' if playing, 'False' if paused. */
    isPlaying: PropTypes.bool.isRequired,
    onPlayPauseChanged: PropTypes.func,
    onFrameRateChanged: PropTypes.func,
    onClickNextButton: PropTypes.func,
    onClickBackButton: PropTypes.func,
    onClickSkipToStart: PropTypes.func,
    onClickSkipToEnd: PropTypes.func,
    /** i18next translation function */
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    cineMinFrameRate: 1,
    cineMaxFrameRate: 90,
    cineStepFrameRate: 1,
    cineFrameRate: 24,
    isPlaying: false,
  };

  componentDidUpdate(prevProps) {
    // TODO: Not sure if we should just switch this to a stateless
    // fully-controlled component instead
    if (
      this.props.isPlaying !== prevProps.isPlaying ||
      this.props.isPlaying !== this.state.isPlaying
    ) {
      this.setState({
        isPlaying: this.props.isPlaying,
      });
    }

    if (
      this.props.cineFrameRate !== prevProps.cineFrameRate ||
      this.props.cineFrameRate !== this.state.cineFrameRate
    ) {
      this.setState({
        cineFrameRate: this.props.cineFrameRate,
      });
    }
  }

  handleInputChange = event => {
    const target = event.target;

    let value = target.value;

    if (target.type === 'range') {
      value = parseFloat(target.value);
    }

    const name = target.name;

    this.setState({
      [name]: value,
    });

    if (name === 'cineFrameRate' && this.props.onFrameRateChanged) {
      this.props.onFrameRateChanged(parseFloat(value));
    }
  };

  onClickPlayPause = () => {
    const value = !this.state.isPlaying;

    this.setState({
      isPlaying: value,
    });

    if (this.props.onPlayPauseChanged) {
      this.props.onPlayPauseChanged(value);
    }
  };

  onClickNextButton = event => {
    if (this.props.onClickNextButton) {
      this.props.onClickNextButton(event);
    }
  };

  onClickBackButton = event => {
    if (this.props.onClickBackButton) {
      this.props.onClickBackButton(event);
    }
  };

  onClickSkipToStart = event => {
    if (this.props.onClickSkipToStart) {
      this.props.onClickSkipToStart(event);
    }
  };

  onClickSkipToEnd = event => {
    if (this.props.onClickSkipToEnd) {
      this.props.onClickSkipToEnd(event);
    }
  };

  render() {
    const { t } = this.props;
    return (
      <div className="CineDialog">
        <div className="noselect double-row-style">
          <div className="cine-controls">
            <div className="btn-group">
              <button
                title={t('Skip to first image')}
                className="btn"
                data-toggle="tooltip"
                onClick={this.onClickSkipToStart}
              >
                <Icon name="fast-backward" />
              </button>
              <button
                title={t('Previous image')}
                className="btn"
                data-toggle="tooltip"
                onClick={this.onClickBackButton}
              >
                <Icon name="step-backward" />
              </button>
              <button
                title={t('Play / Stop')}
                className="btn"
                data-toggle="tooltip"
                onClick={this.onClickPlayPause}
              >
                <Icon name={this.state.isPlaying ? 'stop' : 'play'} />
              </button>
              <button
                title={t('Next image')}
                className="btn"
                data-toggle="tooltip"
                onClick={this.onClickNextButton}
              >
                <Icon name="step-forward" />
              </button>
              <button
                title={t('Skip to last image')}
                className="btn"
                data-toggle="tooltip"
                onClick={this.onClickSkipToEnd}
              >
                <Icon name="fast-forward" />
              </button>
            </div>
          </div>
          <div className="cine-options">
            <div className="fps-section">
              <input
                type="range"
                name="cineFrameRate"
                min={this.props.cineMinFrameRate}
                max={this.props.cineMaxFrameRate}
                step={this.props.cineStepFrameRate}
                value={this.state.cineFrameRate}
                onChange={this.handleInputChange}
              />
            </div>
            <span className="fps">
              {this.state.cineFrameRate.toFixed(1)} {t('fps')}
            </span>
          </div>
        </div>
      </div>
    );
  }
}

const connectedComponent = withTranslation('CineDialog')(CineDialog);
export { connectedComponent as CineDialog };
export default connectedComponent;
