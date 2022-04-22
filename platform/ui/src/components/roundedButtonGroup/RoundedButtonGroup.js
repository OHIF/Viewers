import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Icon } from './../../elements/Icon';
import './RoundedButtonGroup.css';

// TODO: Rename to Toggle?
class RoundedButtonGroup extends Component {
  static className = 'RoundedButtonGroup';

  static propTypes = {
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.any,
        label: PropTypes.string,
        stateEvent: PropTypes.string,
        icon: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          }),
        ]),
      })
    ),
    value: PropTypes.string,
    onValueChanged: PropTypes.func,
  };

  static defaultProps = {
    options: [],
    value: null,
  };

  state = {
    badgeNumbers: [],
  };

  constructor() {
    super();
    this.onStateEvent = this.onStateEvent.bind(this);
  }

  onClickOption = value => {
    let newValue = value;
    if (this.props.value === value) {
      newValue = null;
    }

    if (this.props.onValueChanged) {
      this.props.onValueChanged(newValue);
    }
  };

  onStateEvent(event) {
    const optionIndex = this.props.options.findIndex(
      o => o.value === event.detail.target
    );
    if (optionIndex > -1) {
      const badgeNumbers = this.state.badgeNumbers;
      badgeNumbers[optionIndex] = event.detail.badgeNumber;
      this.setState({ badgeNumbers });
    }
  }

  componentDidMount() {
    this.props.options.forEach(option => {
      if (option.stateEvent) {
        document.addEventListener(option.stateEvent, this.onStateEvent);
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    this.props.options.forEach((option, index) => {
      if (
        option.stateEvent &&
        option.stateEvent !==
          (prevProps.options[index]
            ? prevProps.options[index].stateEvent
            : null)
      ) {
        document.removeEventListener(option.stateEvent, this.onStateEvent);
        document.addEventListener(option.stateEvent, this.onStateEvent);
      }
    });
  }

  componentWillUnmount() {
    this.props.options.forEach(option => {
      if (option.stateEvent) {
        document.removeEventListener(option.stateEvent, this.onStateEvent);
      }
    });
  }

  render() {
    let className = classnames(
      RoundedButtonGroup.className,
      'clearfix center-table'
    );

    const buttons = this.props.options.map((option, index) => {
      const className = classnames({
        roundedButtonWrapper: true,
        noselect: true,
        active: this.props.value === option.value,
      });

      const optionText = option.label && <span>{option.label}</span>;
      const iconProps =
        typeof option.icon === 'string' ? { name: option.icon } : option.icon;

      const bottomLabel = option.bottomLabel && (
        <div className="bottomLabel">{option.bottomLabel}</div>
      );

      let badgeNumber = this.state.badgeNumbers[index];
      const badgeNumberOverflow = String(badgeNumber).length > 2;
      badgeNumber = badgeNumber
        ? badgeNumberOverflow
          ? 99
          : badgeNumber
        : null;

      return (
        <div
          key={index}
          className={className}
          onClick={() => this.onClickOption(option.value)}
        >
          <div className="roundedButton">
            {optionText}
            {badgeNumber && (
              <div className="badgeNumber-container">
                <span className="badgeNumber">
                  {badgeNumber}
                  {badgeNumberOverflow && '+'}
                </span>
              </div>
            )}
            {iconProps && <Icon {...iconProps} />}
          </div>
          {bottomLabel}
        </div>
      );
    });

    return <div className={className}>{buttons}</div>;
  }
}

export { RoundedButtonGroup };
