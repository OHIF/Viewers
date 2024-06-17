import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './ImageScrollbar.css';

class ImageScrollbar extends PureComponent {
  static propTypes = {
    value: PropTypes.number.isRequired,
    max: PropTypes.number.isRequired,
    height: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onContextMenu: PropTypes.func,
  };

  render() {
    if (this.props.max === 0) {
      return null;
    }

    this.style = {
      width: `${this.props.height}`,
    };

    const { onContextMenu = e => e.preventDefault() } = this.props;

    return (
      <div
        className="scroll"
        onContextMenu={onContextMenu}
      >
        <div className="scroll-holder">
          <input
            // adding mousetrap let the mousetrap know about the scrollbar otherwise,
            // it will not capture the keyboard event
            className="imageSlider mousetrap"
            style={this.style}
            type="range"
            min="0"
            max={this.props.max}
            step="1"
            value={this.props.value}
            onChange={this.onChange}
            onKeyDown={this.onKeyDown}
          />
        </div>
      </div>
    );
  }

  onChange = event => {
    const intValue = parseInt(event.target.value, 10);
    this.props.onChange(intValue);
  };

  onKeyDown = event => {
    // We don't allow direct keyboard up/down input on the
    // image sliders since the natural direction is reversed (0 is at the top)

    // Store the KeyCodes in an object for readability
    const keys = {
      DOWN: 40,
      UP: 38,
    };

    // TODO: Enable scroll down / scroll up without depending on ohif-core
    if (event.which === keys.DOWN) {
      //OHIF.commands.run('scrollDown');
      event.preventDefault();
    } else if (event.which === keys.UP) {
      //OHIF.commands.run('scrollUp');
      event.preventDefault();
    }
  };
}

export default ImageScrollbar;
