import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import LocationsList from './LocationsList';
import './googleCloud.css';

export default class LocationPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      locations: [],
    };
  }

  static propTypes = {
    project: PropTypes.object,
    onSelect: PropTypes.func,
    oidcKey: PropTypes.string,
  };

  async componentDidMount() {
    api.setOidcStorageKey(this.props.oidcKey);

    const response = await api.loadLocations(this.props.project.projectId);

    this.loading = false;
    if (response.isError) {
      this.error = response.message;
      return;
    }
    this.setState({ locations: response.data.locations || [] });
  }

  static defaultProps = {};

  render() {
    const { locations, loading, error } = this.state;
    const { onSelect } = this.props;
    return (
      <LocationsList
        locations={locations}
        loading={loading}
        error={error}
        onSelect={onSelect}
      ></LocationsList>
    );
  }
}
