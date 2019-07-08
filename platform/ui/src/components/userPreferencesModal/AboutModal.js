import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap-modal';
import './AboutModal.styl';

import 'react-bootstrap-modal/lib/css/rbm-patch.css';

// TODO: Is this the only component importing these?
import './../../design/styles/common/modal.styl';

export class AboutModal extends Component {
  constructor(props) {
    super(props);
  }
  // TODO: Make this component more generic to allow things other than W/L and hotkeys...
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onCancel: PropTypes.func,
  };

  static itemsPreset = [
    {
      name: 'Repository URL',
      value: 'https://github.com/OHIF/Viewers/',
    },
    {
      name: 'Latest Master Commits',
      value: 'https://github.com/OHIF/Viewers/commits/master',
    },
  ];

  static defaultProps = {
    isOpen: false,
  };

  renderTableRow(item) {
    return (
      <tr key={item.name}>
        <td>{item.name}</td>
        <td>
          <a target="_blank" href={item.value}>
            {item.value}
          </a>
        </td>
      </tr>
    );
  }

  render() {
    return (
      <Modal
        show={this.props.isOpen}
        onHide={this.props.onCancel}
        aria-labelledby="ModalHeader"
        className="AboutModal modal fade themed in"
        backdrop={false}
        large={true}
        keyboard={false}
      >
        <Modal.Header closeButton>
          <Modal.Title>About</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="btn-group">
            <a
              className="btn btn-default"
              target="_blank"
              href="https://groups.google.com/forum/#!forum/cornerstone-platform"
            >
              Visit the forum
            </a>
            <a
              className="btn btn-default"
              target="_blank"
              href="https://github.com/OHIF/Viewers/issues"
            >
              Report an issue
            </a>
            <a
              className="btn btn-default"
              target="_blank"
              href="http://ohif.org"
            >
              More details
            </a>
          </div>
          <div>
            <h3>Version Information</h3>
            <table className="table table-responsive">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {AboutModal.itemsPreset.map(item => this.renderTableRow(item))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}
