import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { DropTarget } from 'react-dnd'; // todo: maybe missing from this lib?
import './LayoutPanelDropTarget.css';

// Drag sources and drop targets only interact
// if they have the same string type.
const Types = {
  THUMBNAIL: 'thumbnail',
};

const divTarget = {
  drop(props, monitor, component) {
    const item = monitor.getItem();

    if (props.onDrop) {
      props.onDrop({
        viewportIndex: props.viewportIndex,
        item,
      });
    }

    return {
      id: `LayoutPanelDropTarget-${props.viewportIndex}`,
      viewportIndex: props.viewportIndex,
      item,
    };
  },
};

// TODO: Find out why we can't move this into the Example app instead.
// It looks like the context isn't properly shared.
class LayoutPanelDropTarget extends Component {
  static defaultProps = {
    isOver: false,
    canDrop: false,
  };

  static propTypes = {
    connectDropTarget: PropTypes.func.isRequired,
    canDrop: PropTypes.bool.isRequired,
    isOver: PropTypes.bool.isRequired,
    viewportComponent: PropTypes.object,
    style: PropTypes.object,
  };

  render() {
    const { canDrop, isOver, connectDropTarget, style } = this.props;
    const isActive = canDrop && isOver;

    let className = 'viewport-drop-target';

    if (isActive) {
      className += ' hovered';
    } else if (canDrop) {
      className += ' can-drop';
    }

    return connectDropTarget(
      <div className={className} style={style}>
        {this.props.children}
      </div>
    );
  }
}

const collect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  canDrop: monitor.canDrop(),
  isOver: monitor.isOver(),
});

export default DropTarget(Types.THUMBNAIL, divTarget, collect)(
  LayoutPanelDropTarget
);
