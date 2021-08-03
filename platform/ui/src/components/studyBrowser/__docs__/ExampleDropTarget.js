import React, { Component } from 'react';
import { DropTarget } from 'react-dnd';
import PropTypes from 'prop-types';
import './ExampleDropTarget.css';

// Drag sources and drop targets only interact
// if they have the same string type.
const Types = {
  THUMBNAIL: 'thumbnail',
};

const divTarget = {
  drop(props, monitor, component) {
    // Note: For this example we use setState, but in
    // OHIF we will update the redux store instead
    const item = monitor.getItem();

    component.setState({
      item: {
        id: item.id,
        SeriesDescription: item.SeriesDescription,
      },
    });
    return { id: 'ExampleDropTarget' };
  },
};

// TODO: Find out why we can't move this into the Example app instead.
// It looks like the context isn't properly shared.
class CustomDropTarget extends Component {
  static className = 'ExampleDropTarget';

  state = {
    item: null,
  };

  static defaultProps = {
    isOver: false,
  };

  static propTypes = {
    connectDropTarget: PropTypes.func.isRequired,
    canDrop: PropTypes.bool.isRequired,
    isOver: PropTypes.bool.isRequired,
  };

  render() {
    const { canDrop, isOver, connectDropTarget } = this.props;
    const isActive = canDrop && isOver;

    let className = ExampleDropTarget.className;

    if (isActive) {
      className += ' hovered';
    } else if (canDrop) {
      className += ' can-drop';
    }

    return connectDropTarget(
      <div className={className}>
        <h4>
          {isActive
            ? 'Release to drop'
            : 'Drag / Drop something from the Study Browser here'}
        </h4>
        <p className="study-drop-results">
          {this.state.item && JSON.stringify(this.state.item)}
        </p>
      </div>
    );
  }
}

const collect = (connect, monitor) => ({
  connectDropTarget: connect.dropTarget(),
  isOver: monitor.isOver(),
  canDrop: monitor.canDrop(),
});

const ExampleDropTarget = DropTarget(Types.THUMBNAIL, divTarget, collect)(
  CustomDropTarget
);

export { ExampleDropTarget };
