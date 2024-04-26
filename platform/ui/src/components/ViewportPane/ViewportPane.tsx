import classnames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

// NOTE: If we found a way to make `useDrop` conditional,
// Or we provided a HOC of this component, we could provide
// this UI without the DragAndDropContext dependency.
function ViewportPane({
  children,
  className,
  customStyle,
  isActive,
  onDrop,
  onDrag,
  onEndDragHandler,
  viewportIsHighlighted,
  onDoubleClick,
  onInteraction,
  acceptDropsFor,
  dragData,
}) {
  let dropElement = null;

  const [{ isHovered }, drop] = useDrop({
    accept: acceptDropsFor,
    // TODO: pass in as prop?
    drop: (droppedItem, monitor) => {
      const canDrop = monitor.canDrop();
      const isOver = monitor.isOver();

      if (canDrop && isOver && onDrop) {
        onInteractionHandler();
        onDrop(droppedItem, dragData);
      }
    },
    hover: (droppedItem, monitor) => {
      const canDrop = monitor.canDrop();
      const isOver = monitor.isOver();

      if (canDrop && isOver && onDrop) {
        onDrag(droppedItem, dragData);
      }
    },
    // Monitor, and collect props; returned as values by `useDrop`
    collect: monitor => ({
      isHighlighted: monitor.canDrop(),
      isHovered: monitor.isOver(),
    }),
  });

  const [collectedProps, drag, dragPreview] = useDrag({
    type: 'displayset',
    item: { ...dragData },
    canDrag: function () {
      return Object.keys(dragData).length !== 0;
    },
    end() {
      onEndDragHandler();
    },
  });

  const focus = () => {
    if (dropElement) {
      dropElement.focus();
    }
  };

  const onInteractionHandler = event => {
    focus();
    onInteraction(event);
  };

  const refHandlerDrop = element => {
    drop(element);
    dropElement = element;
  };

  const refHandlerDrag = element => {
    drag(element);
  };

  const refHandler = el => {
    refHandlerDrag(el);
    refHandlerDrop(el);
  };

  return (
    <div
      // ref={refHandler}
      ref={refHandler}
      // onInteractionHandler...
      // https://reactjs.org/docs/events.html#mouse-events
      // https://stackoverflow.com/questions/8378243/catch-scrolling-event-on-overflowhidden-element
      // onMouseDown={onInteractionHandler}
      onDoubleClick={onDoubleClick}
      onClick={onInteractionHandler}
      onScroll={onInteractionHandler}
      onWheel={onInteractionHandler}
      className={classnames(
        'hover:border-primary-light group h-full w-full overflow-hidden rounded-md transition duration-1000',
        {
          'border-primary-light border-2': isActive,
          'border-2 border-transparent': !isActive,
          'border-2 bg-purple-700': isHovered,
          // 'animate-pulse': viewportIsHighlighted, // Add this back for pulsating effect
        },
        className
      )}
      style={{
        ...customStyle,
      }}
    >
      <div
        className={classnames(
          'h-full w-full overflow-hidden rounded-md group-hover:border-transparent',
          {
            'border border-transparent': isActive,
            'border-secondary-light border': !isActive,
          },
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

ViewportPane.propTypes = {
  /** The ViewportComp */
  children: PropTypes.node.isRequired,
  /** Classes to append to container */
  className: PropTypes.string,
  customStyle: PropTypes.object,
  /** Bool to show active styling */
  isActive: PropTypes.bool.isRequired,
  /** Indicates drag items we should accept for drops */
  acceptDropsFor: PropTypes.string.isRequired,
  /** Function that handles drop events */
  onDrop: PropTypes.func.isRequired,
  /** Function that handles drag events */
  onDrag: PropTypes.func.isRequired,
  /** Function that handles end drag events */
  onEndDragHandler: PropTypes.func.isRequired,
  /** Bool to show if the origin viewport should be highlighted */
  viewportIsHighlighted: PropTypes.bool,
  /** Called when the viewportPane is interacted with by the user */
  onInteraction: PropTypes.func.isRequired,
  /** Executed when the pane is double clicked */
  onDoubleClick: PropTypes.func,
  dragData: PropTypes.object,
  originViewportId: PropTypes.string,
};

const noop = () => {};

ViewportPane.defaultProps = {
  onInteraction: noop,
};

export default ViewportPane;
