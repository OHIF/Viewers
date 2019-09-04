import React, { PureComponent } from 'react';
import Modal from 'react-bootstrap-modal';
import 'react-bootstrap-modal/lib/css/rbm-patch.css';
import PropTypes from 'prop-types';
import { TextInput, Select } from '@ohif/ui';

import './DownloadDialog.styl';
import { withTranslation } from '../../utils/LanguageProvider';


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

    this.props.save(formData);

    return false;
  };

  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggleDownloadDialog: PropTypes.func.isRequired,
    save: PropTypes.func.isRequired,
    mountPreview: PropTypes.func.isRequired,
    resize: PropTypes.func.isRequired,
    toggleAnnotations: PropTypes.func.isRequired,
    setCacheReferences: PropTypes.func.isRequired,
  };

  /**
   * assignRef
   * This way to pass trough a ref is needed to make a dom ref accessible on
   * static method getDerivedStateFromProps, what will replace componentWillReceiveProps
   * See https://fb.me/react-async-component-lifecycle-hooks for details.
   * @param references dom element ref to cache on state
   */
  assignRef = references => {
    if (references !== null) {

      this.setState({ previewElementRef: references, });

      this.props.setCacheReferences(
        references,
        this.props.activeEnabledElement,
        this.state.showAnnotations,
      );

      this.props.mountPreview();
    }
  };

  onClose() {
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
          <Modal.Title>Download High Quality Image</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={this.submitForm}>
            <div className="container">

              <div className="title">
                Please specify the dimensions, filename, and desired type for the output image.
              </div>

              <div className="file-info-container">

                <div className="col">
                  <div className="sizes">
                    <TextInput
                      type="number"
                      min="1"
                      max="16384"
                      value={this.state.width}
                      label="Size (px)"
                      onChange={e => {
                        this.setState({ width: e.currentTarget.value });
                        this.props.resize(null, 'width', this.state.width);
                      }}
                    />
                  </div>
                </div>

                <div className="col">

                  <div className="file-name">
                    <TextInput
                      type="text"
                      value={this.state.fileName}
                      onChange={e => {
                        this.setState({ fileName: e.currentTarget.value })
                      }}
                      label="File Name"
                      id="file-name"
                    />
                  </div>

                  <div className="file-type">
                    <Select
                      value={this.state.fileType}
                      onChange={e => {
                        this.setState({ fileType: e.currentTarget.value })
                      }}
                      options={this.state.fileTypeOptions}
                      label="File  Type "
                    />
                  </div>

                </div>

                <div className="col">

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
                            e.target.checked
                          );

                          this.props.toggleAnnotations(e.target.checked, true);
                        }}
                      />
                    </label>
                  </div>

                </div>

              </div>

              <div className="preview">
                <h4>Image Preview</h4>
                <img
                  className="preview-container"
                  ref={this.assignRef}
                  alt="Download Preview"
                />
              </div>

              <div className="actions">
                <div className="action-cancel">
                  <button type="button" className="btn btn-danger" onClick={this.onClose}>Cancel</button>
                </div>
                <div className="action-save">
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