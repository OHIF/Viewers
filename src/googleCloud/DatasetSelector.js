import React, { Component } from 'react';
import PropTypes from 'prop-types';
import DicomStorePicker from './DicomStorePicker';
import DatasetPicker from './DatasetPicker';
import ProjectPicker from './ProjectPicker';
import LocationPicker from './LocationPicker';
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

    this.onProjectSelect = this.onProjectSelect.bind(this);
    this.onLocationSelect = this.onLocationSelect.bind(this);
    this.onDatasetSelect = this.onDatasetSelect.bind(this);
    this.onDicomStoreSelect = this.onDicomStoreSelect.bind(this);
    this.onProjectClick = this.onProjectClick.bind(this);
    this.onLocationClick = this.onLocationClick.bind(this);
    this.onDatasetClick = this.onDatasetClick.bind(this);
  }

  static propTypes = {
    id: PropTypes.string,
    event: PropTypes.string,
    oidcKey: PropTypes.string,
    canClose: PropTypes.string,
    setServers: PropTypes.func.isRequired,
  };
  static defaultProps = {};

  onProjectSelect(project) {
    this.setState({
      project: project,
    });
  }

  onLocationSelect(location) {
    this.setState({
      location: location,
    });
  }

  onDatasetSelect(dataset) {
    this.setState({
      dataset: dataset,
    });
  }

  onProjectClick() {
    this.setState({
      dataset: null,
    });
    this.setState({
      location: null,
    });
    this.setState({
      project: null,
    });
  }

  onLocationClick() {
    this.setState({
      dataset: null,
    });
    this.setState({
      location: null,
    });
  }

  onDatasetClick() {
    this.setState({
      dataset: null,
    });
  }

  onDicomStoreSelect(dicomStoreJson) {
    const dicomStore = dicomStoreJson.name;
    const parts = dicomStore.split('/');
    const result = {
      wadoUriRoot: `https://healthcare.googleapis.com/v1beta1/${dicomStore}/dicomWeb`,
      qidoRoot: `https://healthcare.googleapis.com/v1beta1/${dicomStore}/dicomWeb`,
      wadoRoot: `https://healthcare.googleapis.com/v1beta1/${dicomStore}/dicomWeb`,
      project: parts[1],
      location: parts[3],
      dataset: parts[5],
      dicomStore: parts[7],
    };
    this.props.setServers(result);
  }

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
            <span onClick={() => onProjectClick(null)}>{project.name}</span>
            {project && location && (
              <>
                <span onClick={() => onLocationClick(null)}>
                  {' '}
                  -> {location.name.split('/')[3]}
                </span>
                {project && location && dataset && (
                  <span onClick={() => onDatasetClick(null)}>
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
