import React, { Component } from 'react';
import PropTypes from 'prop-types';
import api from './api/GoogleCloudApi';
import ProjectsList from './ProjectsList';
import './googleCloud.css';

export default class ProjectPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      loading: false,
      projects: [],
    };
  }

  static propTypes = {
    onSelect: PropTypes.func,
    oidcKey: PropTypes.string,
  };
  static defaultProps = {};

  async componentDidMount() {
    api.setOidcStorageKey(this.props.oidcKey);
    const response = await api.loadProjects();
    this.loading = false;
    if (response.isError) {
      this.error = response.message;
      return;
    }
    this.setState({ projects: response.data.projects || [] });
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
      ></ProjectsList>
    );
  }
}
