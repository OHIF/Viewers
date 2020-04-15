import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import LocationsList from './LocationsList';
import './googleCloud.css';

export default class LocationPicker extends Component {
  state = {
    error: null,
    loading: true,
    locations: [],
    filterStr: '',
  };

  static propTypes = {
    project: PropTypes.object,
    onSelect: PropTypes.func,
    accessToken: PropTypes.string,
  };

  async componentDidMount() {
    api.setAccessToken(this.props.accessToken);

    const response = await api.loadLocations(this.props.project.projectId);

    if (response.isError) {
      this.setState({
        error: response.message,
      });

      return;
    }

    this.setState({
      locations: response.data.locations || [],
      loading: false,
    });
  }

  render() {
    const { locations, loading, error, filterStr } = this.state;
    const { onSelect } = this.props;
    return (
      <div>
        <input
          className="form-control gcp-input"
          type="text"
          value={filterStr}
          onChange={e => this.setState({ filterStr: e.target.value })}
        />
        <LocationsList
          locations={locations}
          loading={loading}
          error={error}
          filter={filterStr}
          onSelect={onSelect}
        />
      </div>
    );
  }
}
