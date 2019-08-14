import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import ProjectsList from './ProjectsList';
import './googleCloud.css';

export default class ProjectPicker extends Component {
  state = {
    error: null,
    loading: true,
    projects: [],
  };

  static propTypes = {
    onSelect: PropTypes.func,
    accessToken: PropTypes.string,
  };

  async componentDidMount() {
    api.setAccessToken(this.props.accessToken);
    const response = await api.loadProjects();

    if (response.isError) {
      this.setState({
        error: response.message,
      });

      return;
    }

    this.setState({
      projects: response.data.projects || [],
      loading: false,
    });
  }

  render() {
    const { projects, loading, error } = this.state;
    const { onSelect } = this.props;
    return (
      <ProjectsList
        projects={projects}
        loading={loading}
        error={error}
        onSelect={onSelect}
      />
    );
  }
}
