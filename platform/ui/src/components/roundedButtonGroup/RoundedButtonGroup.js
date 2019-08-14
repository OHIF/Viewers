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

  onClickOption = value => {
    let newValue = value;
    if (this.props.value === value) {
      newValue = null;
    }

    if (this.props.onValueChanged) {
      this.props.onValueChanged(newValue);
    }
  };

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

      return (
        <div
          key={index}
          className={className}
          onClick={() => this.onClickOption(option.value)}
        >
          <div className="roundedButton">
            {optionText}
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
