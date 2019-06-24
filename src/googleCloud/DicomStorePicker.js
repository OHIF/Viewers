import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import DicomStoreList from './DicomStoreList';
import './googleCloud.css';

export default class DicomStorePicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      stores: [],
      locations: [],
    };
  }

  static propTypes = {
    dataset: PropTypes.object,
    onSelect: PropTypes.func,
  };
  static defaultProps = {};

  async componentDidMount() {
    const { authority, client_id } = window.config.oidc[0];
    const oidcStorageKey = `oidc.user:${authority}:${client_id}`;
    api.setOidcStorageKey(oidcStorageKey);
    const response = await api.loadDicomStores(this.props.dataset.name);
    this.loading = false;
    if (response.isError) {
      this.error = response.message;
      return;
    }
    this.setState({ stores: response.data.dicomStores || [] });
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
      ></DicomStoreList>
    );
  }
}
