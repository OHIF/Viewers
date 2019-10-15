import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Modal from 'react-bootstrap-modal';
import detect from 'browser-detect';
import './AboutModal.styl';
import { withTranslation } from '../../utils/LanguageProvider';

import 'react-bootstrap-modal/lib/css/rbm-patch.css';

// TODO: Is this the only component importing these?
import './../../design/styles/common/modal.styl';

class AboutModal extends Component {
  constructor(props) {
    super(props);
  }
  // TODO: Make this component more generic to allow things other than W/L and hotkeys...
  static propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onCancel: PropTypes.func,
  };

  itemsPreset() {
    const { t } = this.props;
    const browser = detect();
    const capitalize = s =>
      s.substr(0, 1).toUpperCase() + s.substr(1).toLowerCase();

    return [
      {
        name: t('Repository URL'),
        value: 'https://github.com/OHIF/Viewers/',
        link: 'https://github.com/OHIF/Viewers/',
      },
      {
        name: t('Latest Master Commits'),
        value: 'https://github.com/OHIF/Viewers/commits/master',
        link: 'https://github.com/OHIF/Viewers/commits/master',
      },
      {
        name: 'Version Number',
        value: process.env.VERSION_NUMBER,
      },
      {
        name: t('Build Number'),
        value: process.env.BUILD_NUM,
      },
      {
        name: t('Browser'),
        value: `${capitalize(browser.name)} ${browser.version}`,
      },
      {
        name: t('OS'),
        value: browser.os,
      },
    ];
  }

  static defaultProps = {
    isOpen: false,
  };

  renderTableRow(item) {
    return (
      <tr key={item.name}>
        <td>{item.name}</td>
        <td>
          {item.link ? (
            <a target="_blank" href={item.link}>
              {item.value}
            </a>
          ) : (
            item.value
          )}
        </td>
      </tr>
    );
  }

  render() {
    const { t } = this.props;
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
          <Modal.Title>{t('OHIF Viewer - About')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="btn-group">
            <a
              className="btn btn-default"
              target="_blank"
              href="https://groups.google.com/forum/#!forum/cornerstone-platform"
            >
              {t('Visit the forum')}
            </a>
            {` `}
            <a
              className="btn btn-default"
              target="_blank"
              href="https://github.com/OHIF/Viewers/issues/new/choose"
            >
              {t('Report an issue')}
            </a>
            {` `}
            <a
              className="btn btn-default"
              target="_blank"
              href="http://ohif.org"
            >
              {t('More details')}
            </a>
          </div>
          <div>
            <h3>{t('Version Information')}</h3>
            <table className="table table-responsive">
              <thead>
                <tr>
                  <th>{t('Name')}</th>
                  <th>{t('Value')}</th>
                </tr>
              </thead>
              <tbody>
                {this.itemsPreset().map(item => this.renderTableRow(item))}
              </tbody>
            </table>
          </div>
        </Modal.Body>
      </Modal>
    );
  }
}

const connectedComponent = withTranslation('AboutModal')(AboutModal);
export { connectedComponent as AboutModal };
export default connectedComponent;
