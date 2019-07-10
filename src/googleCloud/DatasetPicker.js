import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import DatasetsList from './DatasetsList';
import './googleCloud.css';

export default class DatasetPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      datasets: [],
    };
  }

  static propTypes = {
    project: PropTypes.object,
    location: PropTypes.object,
    onSelect: PropTypes.func,
    oidcKey: PropTypes.string,
  };
  static defaultProps = {};

  async componentDidMount() {
    api.setOidcStorageKey(this.props.oidcKey);

    const response = await api.loadDatasets(
      this.props.project.projectId,
      this.props.location.locationId
    );
    this.loading = false;
    if (response.isError) {
      this.error = response.message;
      return;
    }
    this.setState({ datasets: response.data.datasets || [] });
  }

  render() {
    const { datasets, loading, error } = this.state;
    const { onSelect } = this.props;
    return (
      <DatasetsList
        datasets={datasets}
        loading={loading}
        error={error}
        onSelect={onSelect}
      ></DatasetsList>
    );
  }
}
