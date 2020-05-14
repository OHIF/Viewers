import React from 'react';
import { useDrop } from 'react-dnd';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const ViewportPane = function(props) {
  const { children, onDrop, viewportIndex } = props;
  const [{ isHovered, isHighlighted }, drop] = useDrop({
    accept: 'displayset',
    drop: (displaySet, monitor) => {
      const canDrop = monitor.canDrop();
      const isOver = monitor.isOver();

      if (canDrop && isOver && onDrop) {
        const { StudyInstanceUID, displaySetInstanceUID } = displaySet;

        onDrop({ viewportIndex, StudyInstanceUID, displaySetInstanceUID });
      }
    },
    // Monitor, and collect props; returned as values by `useDrop`
    collect: monitor => ({
      isHighlighted: monitor.canDrop(),
      isHovered: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={drop}
      className={classNames({ hovered: isHovered, highlighted: isHighlighted })}
      data-cy={`viewport-pane-${viewportIndex}`}
    >
      {children}
    </div>
  );
};

ViewportPane.propTypes = {
  /** The ViewportComp */
  children: PropTypes.node.isRequired,
  /** Function that handles drop events */
  onDrop: PropTypes.func.isRequired,
  /** The "index" of the viewport in the current ViewportGrid */
  viewportIndex: PropTypes.number.isRequired,
};

export default ViewportPane;
