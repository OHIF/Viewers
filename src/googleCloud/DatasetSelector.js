import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DicomStorePicker from './DicomStorePicker';
import DatasetPicker from './DatasetPicker';
import ProjectPicker from './ProjectPicker';
import LocationPicker from './LocationPicker';
import GoogleCloudApi from './api/GoogleCloudApi';
import './googleCloud.css';

export default class DatasetSelector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      project: null,
      location: null,
      dataset: null,
      unloading: false,
    };
  }

  static propTypes = {
    id: PropTypes.string,
    event: PropTypes.string,
    oidcKey: PropTypes.string,
    canClose: PropTypes.string,
    setServers: PropTypes.func.isRequired,
  };
  static defaultProps = {};

  onProjectSelect = project => {
    this.setState({
      project: project,
    });
  };

  onLocationSelect = location => {
    this.setState({
      location: location,
    });
  };

  onDatasetSelect = dataset => {
    this.setState({
      dataset: dataset,
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
    return (
      <>
        <span className="gcp-picker--title">Google Cloud Healthcare API</span>
        {project && (
          <div className="gcp-picker--path">
            <span onClick={onProjectClick}>{project.name}</span>
            {project && location && (
              <>
                <span onClick={onLocationClick}>
                  {' '}
                  -> {location.name.split('/')[3]}
                </span>
                {project && location && dataset && (
                  <span onClick={onDatasetClick}>
                    {' '}
                    -> {dataset.name.split('/')[5]}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        {!project && (
          <ProjectPicker
            oidcKey={this.props.oidcKey}
            onSelect={onProjectSelect}
          ></ProjectPicker>
        )}

        {project && !location && (
          <>
            <LocationPicker
              oidcKey={this.props.oidcKey}
              project={project}
              onSelect={onLocationSelect}
            ></LocationPicker>
          </>
        )}
        {project && location && !dataset && (
          <>
            <DatasetPicker
              oidcKey={this.props.oidcKey}
              project={project}
              location={location}
              onSelect={onDatasetSelect}
            ></DatasetPicker>
          </>
        )}
        {project && location && dataset && (
          <>
            <DicomStorePicker
              oidcKey={this.props.oidcKey}
              dataset={dataset}
              onSelect={onDicomStoreSelect}
            ></DicomStorePicker>
          </>
        )}
      </>
    );
  }
}
