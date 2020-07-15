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
    filterStr: '',
  };

  static propTypes = {
    dataset: PropTypes.object,
    onSelect: PropTypes.func,
    accessToken: PropTypes.string.isRequired,
  };

  async componentDidMount() {
    api.setAccessToken(this.props.accessToken);

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
    const { stores, loading, error, filterStr } = this.state;
    const { onSelect } = this.props;

    return (
      <div>
        <input
          className="form-control gcp-input"
          type="text"
          value={filterStr}
          onChange={e => this.setState({ filterStr: e.target.value })}
        />
        <DicomStoreList
          stores={stores}
          loading={loading}
          error={error}
          filter={filterStr}
          onSelect={onSelect}
        />
      </div>
    );
  }
}
