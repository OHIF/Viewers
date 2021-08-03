import React, { Component } from 'react';
import { DragDropContext } from 'react-dnd';
import TouchBackend from 'react-dnd-touch-backend';

//
import {
  studies,
  onThumbnailClick,
  onThumbnailDoubleClick,
} from './exampleStudies.js';
import ExampleDropTarget from './ExampleDropTarget.js';
import { StudyBrowser } from './../index.js';

class StudyBrowserContainer extends Component {
  render() {
    //const viewportData = [null, null, null, null];

    return (
      <React.Fragment>
        <ExampleDropTarget />
        <StudyBrowser
          studies={studies}
          onThumbnailClick={onThumbnailClick}
          onThumbnailDoubleClick={onThumbnailDoubleClick}
        />
      </React.Fragment>
    );
  }
}

// Note:
// Normally, the top level APP component is wrapped with the DragDropContext
// We wrap this component to create a simple/local example.
const WrappedStudyBrowser = DragDropContext(
  TouchBackend({ enableMouseEvents: true }),
  null,
  true
)(StudyBrowserContainer);

// http://react-dnd.github.io/react-dnd/docs/api/drag-drop-context
export { WrappedStudyBrowser };
