import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';
import { withTranslation } from 'react-i18next';
import { Icon } from '@ohif/ui';

class DicomStoreList extends Component {
  state = {
    search: '',
  };

  static propTypes = {
    stores: PropTypes.array,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    onSelect: PropTypes.func,
  };

  static defaultProps = {
    loading: true,
  };

  renderTableRow = store => {
    return (
      <tr
        key={store.name}
        className={
          this.state.highlightedItem === store.name
            ? 'noselect active'
            : 'noselect'
        }
        onMouseEnter={() => {
          this.onHighlightItem(store.name);
        }}
        onClick={() => {
          this.props.onSelect(store);
        }}
      >
        <td className="project">{store.name.split('/')[7]}</td>
      </tr>
    );
  };

  onHighlightItem(store) {
    this.setState({ highlightedItem: store });
  }

  render() {
    const { loading, stores, filter, error } = this.props;

    if (error) {
      return <p>{error}</p>;
    }

    const loadingIcon = (
      <Icon name="circle-notch" className="loading-icon-spin loading-icon" />
    );

    if (loading) {
      return loadingIcon;
    }

    const body = (
      <tbody id="StoreList">{
        stores.filter(store => (store.name.split('/')[7].toLowerCase().includes(filter.toLowerCase()) || filter=="")).map(this.renderTableRow)}
      </tbody>
    );

    return (
      <table id="tblStoreList" className="gcp-table table noselect">
        <thead>
          <tr>
            <th>{this.props.t('DICOM Store')}</th>
          </tr>
        </thead>
        {stores && body}
      </table>
    );
  }
}

export default withTranslation('Common')(DicomStoreList);
