import './ToolbarSection.styl';

import React, { PureComponent } from 'react';

import ExpandableToolMenu from '../../viewer/ExpandableToolMenu';
import PropTypes from 'prop-types';
import ToolbarButton from '../../viewer/ToolbarButton';
import classnames from 'classnames';

class ToolbarSection extends PureComponent {
  static defaultProps = {
    className: '',
  };

  static propTypes = {
    buttons: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string,
        label: PropTypes.string.isRequired,
        icon: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          }),
        ]),
        /** Optional: Expandable Tool Menu */
        buttons: PropTypes.arrayOf(PropTypes.shape({})),
      })
    ).isRequired,
    /** Array of string button ids that should show as active */
    activeButtons: PropTypes.arrayOf(PropTypes.string).isRequired,
    /** Class for toolbar section container */
    className: PropTypes.string,
  };

  render() {
    const items = this.props.buttons.map((button, index) => {
      if (button.buttons && Array.isArray(button.buttons)) {
        return (
          <ExpandableToolMenu
            key={`expandable-${index}`}
            {...button}
            activeCommand={button.activeButton}
          />
        );
      } else {
        return (
          <ToolbarButton
            key={index}
            {...button}
            isActive={this.props.activeButtons.includes(button.id)}
          />
        );
      }
    });

    return (
      <div className={classnames('ToolbarSection', this.props.className)}>
        {items}
      </div>
    );
  }
}

export { ToolbarSection };
