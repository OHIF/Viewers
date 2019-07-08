import React, { PureComponent, memo } from 'react';
import { DragLayer } from 'react-dnd';
import PropTypes from 'prop-types';
import { ThumbnailEntry } from './ThumbnailEntry';
import './DragPreview.styl';

let subscribedToOffsetChange = false;
let dragPreviewRef = null;

const collector = monitor => {
  if (!subscribedToOffsetChange) {
    monitor.subscribeToOffsetChange(onOffsetChange(monitor));
    subscribedToOffsetChange = true;
  }

  if (dragPreviewRef) {
    const offset =
      monitor.getSourceClientOffset() || monitor.getInitialSourceClientOffset();

    if (offset) {
      const transform = `translate(${offset.x}px, ${offset.y}px)`;
      dragPreviewRef.style['transform'] = transform;
      dragPreviewRef.style['-webkit-transform'] = transform;
    }
  }

  const item = monitor.getItem();
  let newItem = {};
  if (item) {
    newItem = {
      active: item.active,
      altImageText: item.altImageText,
      id: item.id,
      imageSrc: item.imageSrc,
      imageId: item.imageId,
      instanceNumber: item.instanceNumber,
      error: item.error,
      numImageFrames: item.numImageFrames,
      seriesDescription: item.seriesDescription,
      seriesNumber: item.seriesNumber,
      stackPercentComplete: item.stackPercentComplete,
    };
  }

  return {
    ...newItem,
    isDragging: monitor.isDragging(),
  };
};

const onOffsetChange = monitor => () => {
  if (!dragPreviewRef) return;

  const offset =
    monitor.getSourceClientOffset() || monitor.getInitialSourceClientOffset();
  if (!offset) return;

  const transform = `translate(${offset.x}px, ${offset.y}px)`;
  dragPreviewRef.style['transform'] = transform;
  dragPreviewRef.style['-webkit-transform'] = transform;
};

const updateRef = ref => {
  dragPreviewRef = ref;
};

class DragPreview extends PureComponent {
  render() {
    const { isDragging } = this.props;
    if (!isDragging) return null;
    return (
      <div className="DragPreview">
        <div className="source-preview" ref={updateRef}>
          <ThumbnailEntry {...this.props} />
        </div>
      </div>
    );
  }
}

DragPreview.propTypes = {
  isDragging: PropTypes.bool,
};

export default DragLayer(collector)(memo(DragPreview));
