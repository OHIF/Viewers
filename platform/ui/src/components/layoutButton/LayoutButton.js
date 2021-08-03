import React, { PureComponent } from 'react';

import { LayoutChooser } from './LayoutChooser.js';
import PropTypes from 'prop-types';
import ToolbarButton from '../../viewer/ToolbarButton';

export class LayoutButton extends PureComponent {
  static defaultProps = {
    dropdownVisible: false,
  };

  static propTypes = {
    dropdownVisible: PropTypes.bool.isRequired,
    /** Called with the selectedCell number when grid sell is selected */
    onChange: PropTypes.func,
    /** The cell to show as selected */
    selectedCell: PropTypes.object,
  };

  state = {
    dropdownVisible: this.props.dropdownVisible,
  };

  componentDidUpdate(prevProps) {
    if (this.props.dropdownVisible !== prevProps.dropdownVisible) {
      this.setState({
        dropdownVisible: this.props.dropdownVisible,
      });
    }
  }

  onClick = () => {
    this.setState({
      dropdownVisible: !this.state.dropdownVisible,
    });
  };

  onChange = selectedCell => {
    if (this.props.onChange) {
      this.props.onChange(selectedCell);
    }
  };

  render() {
    return (
      <div className="btn-group">
        <ToolbarButton
          isActive={this.state.dropdownVisible}
          label={'Layout'}
          icon="th"
          onClick={this.onClick}
        />
        <LayoutChooser
          visible={this.state.dropdownVisible}
          onChange={this.onChange}
          onClick={this.onClick}
          selectedCell={this.props.selectedCell}
        />
      </div>
    );
  }
}

export default LayoutButton;
