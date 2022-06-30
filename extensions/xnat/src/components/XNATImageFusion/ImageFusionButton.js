import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ToolbarButton } from '@ohif/ui';
import ConnectedImageFusionDialog from './ConnectedImageFusionDialog';

const DIALOG_ID = 'COMPOSITE_IMAGE_DIALOG_ID';

class ImageFusionButton extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isActive: false,
    };

    this.toggleActive = this.toggleActive.bind(this);
  }

  componentWillUnmount() {
    const { UIDialogService } = this.props.servicesManager.services;
    UIDialogService.dismiss({ id: DIALOG_ID });
  }

  toggleActive() {
    const { isVTK, commandsManager, servicesManager, PiecewiseWidget } = this.props;
    const { UIDialogService, UINotificationService } = servicesManager.services;

    const { isActive } = this.state;

    if (isVTK && !isActive) {
      // Wait until the background image is fully loaded
      const viewports = window.store.getState().viewports;
      const displaySetInstanceUID =
        viewports.viewportSpecificData[0].displaySetInstanceUID;
      if (
        !commandsManager.runCommand('getVolumeProperties', {
          displaySetInstanceUID,
        })
      ) {
        if (UINotificationService) {
          UINotificationService.show({
            title: 'Image Fusion',
            message: 'Please wait until the background image is fully loaded.',
            type: 'info',
          });
        }
        return;
      }
    }

    if (isActive) {
      UIDialogService.dismiss({ id: DIALOG_ID });
    } else {
      const colormaps = commandsManager.runCommand('getColormaps');
      const spacing = 20;
      const { x, y } = document
        .querySelector(`.ViewerMain`)
        .getBoundingClientRect();
      UIDialogService.create({
        id: DIALOG_ID,
        content: ConnectedImageFusionDialog,
        contentProps: {
          onClose: this.toggleActive,
          isVTK: isVTK,
          colormaps: colormaps,
          commandsManager: commandsManager,
          PiecewiseWidget: PiecewiseWidget,
        },
        defaultPosition: {
          x: x + spacing || 0,
          y: y + spacing || 0,
        },
      });
    }

    this.setState({ isActive: !isActive });
  }

  render() {
    const { button } = this.props;
    const { id, label, icon } = button;
    const { isActive } = this.state;

    return (
      <React.Fragment>
        <ToolbarButton
          key={id}
          label={label}
          icon={icon}
          onClick={this.toggleActive}
          isActive={isActive}
        />
      </React.Fragment>
    );
  }
}

ImageFusionButton.propTypes = {
  parentContext: PropTypes.object.isRequired,
  toolbarClickCallback: PropTypes.func.isRequired,
  button: PropTypes.object.isRequired,
  activeButtons: PropTypes.array.isRequired,
  isActive: PropTypes.bool,
  isVTK: PropTypes.bool,
  servicesManager: PropTypes.object,
  commandsManager: PropTypes.object,
  PiecewiseWidget: PropTypes.elementType,
};

ImageFusionButton.defaultProps = {
  isVTK: false,
};

export default ImageFusionButton;
