import './DownloadDialog.styl';

import React, { PureComponent } from 'react';
import { withTranslation } from '../../utils/LanguageProvider';
import Modal from 'react-bootstrap-modal';
import 'react-bootstrap-modal/lib/css/rbm-patch.css';
import PropTypes from 'prop-types';

class DownloadDialog extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: this.props.isOpen,
      width: 3000,
      height: 3000,
      fileName: '',
      fileType: 'png',
      showAnnotations: true,
      fileTypeOptions: [
        {
          key: 'jpg',
          value: 'jpg'
        },
        {
          key: 'png',
          value: 'png'
        }
      ],
      previewElementRef: null
    };

    this.submitForm = this.submitForm.bind(this);
    this.onClose = this.onClose.bind(this);
  }

  submitForm(e) {
    e.preventDefault();

    const formData = {
      width: this.state.width,
      height: this.state.height,
      fileName: this.state.fileName,
      fileType: this.state.fileType,
      showAnnotations: this.state.showAnnotations,
    };

    const thereIsAnyEmpty = Object.values(formData).some(field => field === '');

    if (thereIsAnyEmpty) {
      alert('Please full fill all fields.');
      return false;
    }

    this.props.takeAndDownloadSnapShot(formData);

    return false;
  };

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggleDownloadDialog: PropTypes.func.isRequired,
    takeAndDownloadSnapShot: PropTypes.func.isRequired,
    mountPreview: PropTypes.func.isRequired,
    onResize: PropTypes.func.isRequired,
    toggleAnnotations: PropTypes.func.isRequired,
    forceRenderUpdate: PropTypes.func.isRequired,
    setCacheReferences: PropTypes.func.isRequired,
    cleanViewPortClone: PropTypes.func.isRequired,
  };

  /**
   * assignRef
   * This way to pass trough a ref is needed to make a dom ref accessible on
   * static method getDerivedStateFromProps, what will replace componentWillReceiveProps
   * See https://fb.me/react-async-component-lifecycle-hooks for details.
   * @param references dom element ref to cache on state
   */
  assignRef = references => {
    // Control recalls, allowing this instance on state only once
    if (this.props.updateHash === null && references !== null) {
      this.setState({ previewElementRef: references,  });

      this.props.setCacheReferences(
        references,
        this.props.activeEnabledElement,
        this.props.forceRenderUpdate,
        this.state.showAnnotations,
      );

      this.props.mountPreview();
    }
  };

  onClose() {
    this.props.cleanViewPortClone();
    this.props.toggleDownloadDialog();
  }

  render() {
    return (
      <Modal
        show={this.props.isOpen}
        onHide={this.onClose}
        aria-labelledby="ModalHeader"
        className="DownloadDialog modal fade themed in"
        backdrop={false}
        large={true}
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>Download - Upd {this.props.updateHash}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={this.submitForm}>
            <div className="container">

              <div className="row">
                <div className="col">
                  Please specify the dimensions, filename, and desired type for the output image.
                </div>
              </div>

              <div className="file-info row">
                <div className="file-name col9">
                  <input
                    type="text"
                    placeholder="File Name"
                    value={this.state.fileName}
                    onChange={e => {
                      this.setState({ fileName: e.currentTarget.value })
                    }}
                    className="input-ohif"
                    id="file-name"
                  />
                </div>
                <div className="file-type col3">
                  <select
                    className="select-ohif"
                    value={this.state.fileType}
                    onChange={e => {
                        this.setState({ fileType: e.currentTarget.value })
                      }
                    }
                  >
                    {this.state.fileTypeOptions.map(({ key, value }) => {
                      return (
                        <option key={key} value={value}>{key}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="show-annotations">
                <label htmlFor="show-annotations" className="form-check-label">
                  Show Annotations
                  <input
                    id="show-annotations"
                    type="checkbox"
                    className="form-check-input"
                    checked={this.state.showAnnotations}
                    onChange={e => {
                      this.setState({ showAnnotations: e.target.checked });

                      this.props.setCacheReferences(
                        this.state.previewElementRef,
                        this.props.activeEnabledElement,
                        this.props.forceRenderUpdate,
                        e.target.checked
                      );

                      this.props.toggleAnnotations(e.target.checked, true);
                    }}
                  />
                </label>
              </div>

              <div className="sizes row">
                <div className="sizes_width col">
                  <input
                    type="number"
                    placeholder="Width"
                    value={this.state.width}
                    onChange={e => {
                      this.setState({ width: e.currentTarget.value });
                      this.props.onResize(null, 'width', this.state.width);
                    }}
                    className="input-ohif"
                  />
                </div>
                <div className="sizes_height col">
                  <input
                    type="number"
                    placeholder="Height"
                    value={this.state.height}
                    onChange={e => {
                      this.setState({ height: e.currentTarget.value });
                      this.props.onResize(null, 'height', this.state.width);
                    }}
                    className="input-ohif"
                  />
                </div>
              </div>

              <div className="preview row">
                <div className="col">
                  <div
                    className="preview-container"
                    ref={this.assignRef}
                  />
                </div>
              </div>

              <div className="actions row">
                <div className="action_cancel col">
                  <button type="button" className="btn btn-danger" onClick={this.onClose}>Cancel</button>
                </div>
                <div className="action_download col">
                  <button type="submit" className="btn btn-primary">Download</button>
                </div>
              </div>

            </div>
          </form>
        </Modal.Body>
      </Modal>
    )
  }

}

const connectedComponent = withTranslation('DownloadDialog')(DownloadDialog);
export { connectedComponent as DownloadDialog };
export default connectedComponent;