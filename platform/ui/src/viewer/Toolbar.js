import React, { Component } from 'react';
import PropTypes from 'prop-types';
import SimpleToolbarButton from './SimpleToolbarButton';
import PlayClipButton from './PlayClipButton';
import { LayoutButton } from './../components/layoutButton';

// TODO: This should not be built in the `@ohif/ui` component
function getDefaultButtonData() {
  var buttonData = [
    {
      id: 'wwwc',
      title: 'WW/WC',
      className: 'imageViewerTool',
      icon: 'sun',
    },
    {
      id: 'wwwcRegion',
      title: 'Window by Region',
      className: 'imageViewerTool',
      icon: 'stop',
    },
    {
      id: 'magnify',
      title: 'Magnify',
      className: 'imageViewerTool',
      icon: 'circle',
    },
    {
      id: 'annotate',
      title: 'Annotation',
      className: 'imageViewerTool',
      icon: 'arrows-alt-h',
    },
    {
      id: 'invert',
      title: 'Invert',
      className: 'imageViewerCommand',
      icon: 'adjust',
    },
    {
      id: 'zoom',
      title: 'Zoom',
      className: 'imageViewerTool',
      icon: 'search-plus',
    },
    {
      id: 'pan',
      title: 'Pan',
      className: 'imageViewerTool',
      icon: 'arrows',
    },
    {
      id: 'stackScroll',
      title: 'Stack Scroll',
      className: 'imageViewerTool',
      icon: 'bars',
    },
    {
      id: 'length',
      title: 'Length Measurement',
      className: 'imageViewerTool',
      icon: 'arrows-alt-v',
    },
    {
      id: 'angle',
      title: 'Angle Measurement',
      className: 'imageViewerTool',
      icon: 'fa fa-angle-left',
    },
    {
      id: 'dragProbe',
      title: 'Pixel Probe',
      className: 'imageViewerTool',
      icon: 'fa fa-dot-circle-o',
    },
    {
      id: 'ellipticalRoi',
      title: 'Elliptical ROI',
      className: 'imageViewerTool',
      icon: 'circle-o',
    },
    {
      id: 'rectangleRoi',
      title: 'Rectangle ROI',
      className: 'imageViewerTool',
      icon: 'square-o',
    },
    {
      id: 'resetViewport',
      title: 'Reset Viewport',
      className: 'imageViewerCommand',
      icon: 'reset',
    },
    {
      id: 'clearTools',
      title: 'Clear tools',
      className: 'imageViewerCommand',
      icon: 'trash',
    },
  ];
  return buttonData;
}

export default class Toolbar extends Component {
  static propTypes = {
    buttons: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        icon: PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            name: PropTypes.string.isRequired,
          }),
        ]),
      })
    ).isRequired,
    includeLayoutButton: PropTypes.bool.isRequired,
    includePlayClipButton: PropTypes.bool.isRequired,
  };

  static defaultProps = {
    buttons: getDefaultButtonData(),
    includeLayoutButton: true,
    includePlayClipButton: true,
  };

  render() {
    var maybePlayClipButton;
    if (this.props.includePlayClipButton) {
      maybePlayClipButton = <PlayClipButton />;
    }

    var maybeLayoutButton;
    if (this.props.includeLayoutButton) {
      maybeLayoutButton = <LayoutButton />;
    }

    return (
      <div id="toolbar">
        <div className="btn-group">
          {this.props.buttons.map((button, i) => {
            return <SimpleToolbarButton {...button} key={i} />;
          })}
          {maybePlayClipButton}
          {maybeLayoutButton}
        </div>
      </div>
    );
  }
}
