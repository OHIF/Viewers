import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import DicomStoreList from './DicomStoreList';
import './googleCloud.css';

export default class DicomStorePicker extends Component {
  state = {
    error: null,
    loading: true,
    stores: [],
    locations: [],
  };

  static propTypes = {
    dataset: PropTypes.object,
    onSelect: PropTypes.func,
  };

  async componentDidMount() {
    const { authority, client_id } = window.config.oidc[0];
    const oidcStorageKey = `oidc.user:${authority}:${client_id}`;
    api.setOidcStorageKey(oidcStorageKey);
    const response = await api.loadDicomStores(this.props.dataset.name);

    if (response.isError) {
      this.setState({
        error: response.message,
      });

      return;
    }

    this.setState({
      stores: response.data.dicomStores || [],
      loading: false,
    });
  }

  render() {
    const { stores, loading, error } = this.state;
    const { onSelect } = this.props;

    return (
      <DicomStoreList
        stores={stores}
        loading={loading}
        error={error}
        onSelect={onSelect}
      />
    );
  }
}
