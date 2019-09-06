import React, { PureComponent } from 'react';
import Modal from 'react-bootstrap-modal';
import 'react-bootstrap-modal/lib/css/rbm-patch.css';
import PropTypes from 'prop-types';
import { TextInput, Select } from '@ohif/ui';
import debounce from 'lodash.debounce';

import './DownloadDialog.styl';
import { withTranslation } from '../../utils/LanguageProvider';

const MINIMUM_SIZE = 100;

class DownloadDialog extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      isOpen: this.props.isOpen,
      size: 0,
      height: 0,
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
    this.changeSize = this.changeSize.bind(this);
    this.checkImageBoundaries = this.checkImageBoundaries.bind(this);

    this.debouncedSizeChange = debounce(() => {
      const isImageSizeBadlyConfigured = !this.checkImageBoundaries();

      if (isImageSizeBadlyConfigured) {
        alert(`Image out of boundaries, please review it. Minimum size is ${MINIMUM_SIZE}`);
        return false;
      }

      this.props.resize('width', this.state.width);
      this.props.resize('height', this.state.height);
    }, 500);

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
    const isImageSizeBadlyConfigured = !this.checkImageBoundaries();

    if (thereIsAnyEmpty) {
      alert('Please full fill all fields.');
      return false;
    }

    if (isImageSizeBadlyConfigured) {
      alert('Please review image size.');
      return false;
    }

    this.props.save(formData);
    this.props.toggleAnnotations(true);

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
    getInfo: PropTypes.func.isRequired,
    resetSize: PropTypes.func.isRequired,
  };

  /**
   * mountAndAssignRef
   * This 'eccentric' way to pass trough a ref to state is needed now that
   * 'static' method getDerivedStateFromProps doesnt have access to the instance(this),
   * different of the old way with componentWillReceiveProps
   * See https://fb.me/react-async-component-lifecycle-hooks for details.
   * @param references dom element ref to cache on Download Engine
   */
  mountAndAssignRef = async references => {
    if (references !== null) {
      await this.props.setCacheReferences(
        references,
        this.props.activeEnabledElement,
        this.state.showAnnotations,
      );

      this.setState({
        previewElementRef: references,
        ...this.props.getInfo(),
        showAnnotations: true,
      });

      this.props.mountPreview();
    }
  };

  checkImageBoundaries() {
    return (this.state.width >= MINIMUM_SIZE && this.state.height >= MINIMUM_SIZE);
  }

  changeSize(prop, e) {
    e.persist();

    let { value } = e.currentTarget;
    value = value - this.state[prop];

    const width = this.state.width + value;
    const height = this.state.height + value;

    this.setState({
      width,
      height
    });

    this.debouncedSizeChange();
  }

  onClose() {
    this.props.toggleDownloadDialog();
    this.props.toggleAnnotations(true);
    this.props.resetSize();
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
          <Modal.Title>{this.props.t('Download High Quality Image')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={this.submitForm}>
            <div className="container">

              <div className="title">
                {this.props.t('Please specify the dimensions, filename, and desired type for the output image.')}
              </div>

              <div className="file-info-container">

                <div className="col">
                  <div className="sizes">
                    <TextInput
                      type="number"
                      min={MINIMUM_SIZE}
                      max="16384"
                      value={this.state.width}
                      label={this.props.t('Width (px)')}
                      onChange={e => this.changeSize('width', e)}
                    />
                  </div>
                  <div className="sizes">
                    <TextInput
                      type="number"
                      min={MINIMUM_SIZE}
                      max="16384"
                      value={this.state.height}
                      label={this.props.t('Height (px)')}
                      onChange={ e => this.changeSize('height', e)}
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
                      label={this.props.t('File Name')}
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
                      label={this.props.t('File Type')}
                    />
                  </div>

                </div>

                <div className="col">

                  <div className="show-annotations">
                    <label htmlFor="show-annotations" className="form-check-label">
                      {this.props.t('Show Annotations')}
                      <input
                        id="show-annotations"
                        type="checkbox"
                        className="form-check-input"
                        checked={this.state.showAnnotations}
                        onChange={e => {
                          this.setState({ showAnnotations: e.target.checked });
                          this.props.toggleAnnotations(e.target.checked, true);
                        }}
                      />
                    </label>
                  </div>

                </div>

              </div>

              <div className="preview">
                <h4> {this.props.t('Image Preview')}</h4>
                <img
                  className="preview-container"
                  ref={this.mountAndAssignRef}
                  alt={this.props.t('Image Preview')}
                />
              </div>

              <div className="actions">
                <div className="action-cancel">
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={this.onClose}
                  >
                    {this.props.t('Cancel')}
                  </button>
                </div>
                <div className="action-save">
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {this.props.t('Download')}
                  </button>
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