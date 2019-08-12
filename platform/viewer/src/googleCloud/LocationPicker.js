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
    const { locations, loading, error } = this.state;
    const { onSelect } = this.props;
    return (
      <LocationsList
        locations={locations}
        loading={loading}
        error={error}
        onSelect={onSelect}
      />
    );
  }
}
