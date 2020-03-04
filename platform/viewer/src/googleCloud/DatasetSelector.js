import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { withTranslation } from 'react-i18next';
import DicomStorePicker from './DicomStorePicker';
import DatasetPicker from './DatasetPicker';
import ProjectPicker from './ProjectPicker';
import LocationPicker from './LocationPicker';
import GoogleCloudApi from './api/GoogleCloudApi';
import './googleCloud.css';

class DatasetSelector extends Component {
  state = {
    project: null,
    location: null,
    dataset: null,
    unloading: false,
  };

  static propTypes = {
    id: PropTypes.string,
    event: PropTypes.string,
    user: PropTypes.object,
    canClose: PropTypes.string,
    setServers: PropTypes.func.isRequired,
  };

  onProjectSelect = project => {
    this.setState({
      project,
    });
  };

  onLocationSelect = location => {
    this.setState({
      location,
    });
  };

  onDatasetSelect = dataset => {
    this.setState({
      dataset,
    });
  };

  onProjectClick = () => {
    this.setState({
      dataset: null,
      location: null,
      project: null,
    });
  };

  onLocationClick = () => {
    this.setState({
      dataset: null,
      location: null,
    });
  };

  onDatasetClick = () => {
    this.setState({
      dataset: null,
    });
  };

  onDicomStoreSelect = dicomStoreJson => {
    const dicomStore = dicomStoreJson.name;
    const parts = dicomStore.split('/');
    const result = {
      wadoUriRoot: GoogleCloudApi.urlBase + `/${dicomStore}/dicomWeb`,
      qidoRoot: GoogleCloudApi.urlBase + `/${dicomStore}/dicomWeb`,
      wadoRoot: GoogleCloudApi.urlBase + `/${dicomStore}/dicomWeb`,
      project: parts[1],
      location: parts[3],
      dataset: parts[5],
      dicomStore: parts[7],
    };
    this.props.setServers(result);
  };

  render() {
    const accessToken = this.props.user.access_token;

    const { project, location, dataset } = this.state;
    const {
      onProjectClick,
      onLocationClick,
      onDatasetClick,
      onProjectSelect,
      onLocationSelect,
      onDatasetSelect,
      onDicomStoreSelect,
    } = this;

    let projectBreadcrumbs = (
      <div className="gcp-picker--path">
        <span>{this.props.t('Select a Project')}</span>
      </div>
    );

    if (project) {
      projectBreadcrumbs = (
        <div className="gcp-picker--path">
          <span onClick={onProjectClick}>{project.name}</span>
          {project && location && (
            <span onClick={onLocationClick}>
              {' '}
              -> {location.name.split('/')[3]}
            </span>
          )}
          {project && location && dataset && (
            <span onClick={onDatasetClick}>
              {' '}
              -> {dataset.name.split('/')[5]}
            </span>
          )}
        </div>
      );
    }

    return (
      <>
        {projectBreadcrumbs}
        {!project && (
          <ProjectPicker accessToken={accessToken} onSelect={onProjectSelect} />
        )}

        {project && !location && (
          <LocationPicker
            accessToken={accessToken}
            project={project}
            onSelect={onLocationSelect}
          />
        )}
        {project && location && !dataset && (
          <DatasetPicker
            accessToken={accessToken}
            project={project}
            location={location}
            onSelect={onDatasetSelect}
          />
        )}
        {project && location && dataset && (
          <DicomStorePicker
            accessToken={accessToken}
            dataset={dataset}
            onSelect={onDicomStoreSelect}
          />
        )}
      </>
    );
  }
}

export default withTranslation('Common')(DatasetSelector);
