import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import DatasetsList from './DatasetsList';
import './googleCloud.css';

export default class DatasetPicker extends Component {
  state = {
    error: null,
    loading: true,
    datasets: [],
    filterStr: '',
  };

  static propTypes = {
    project: PropTypes.object,
    location: PropTypes.object,
    onSelect: PropTypes.func,
    accessToken: PropTypes.string,
  };

  async componentDidMount() {
    api.setAccessToken(this.props.accessToken);

    const response = await api.loadDatasets(
      this.props.project.projectId,
      this.props.location.locationId
    );

    if (response.isError) {
      this.setState({
        error: response.message,
      });

      return;
    }

    this.setState({
      datasets: response.data.datasets || [],
      loading: false,
    });
  }

  render() {
    const { datasets, loading, error, filterStr } = this.state;
    const { onSelect } = this.props;
    return (
      <div>
        <input
          className="form-control gcp-input"
          type="text"
          value={filterStr}
          onChange={e => this.setState({ filterStr: e.target.value })}
        />
        <DatasetsList
          datasets={datasets}
          loading={loading}
          error={error}
          filter={filterStr}
          onSelect={onSelect}
        />
      </div>
    );
  }
}
