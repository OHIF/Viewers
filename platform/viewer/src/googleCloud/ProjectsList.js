import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';
import { withTranslation } from 'react-i18next';
import { Icon } from '@ohif/ui';

class ProjectsList extends Component {
  state = {
    search: '',
    highlightedItem: null,
  };

  static propTypes = {
    projects: PropTypes.array,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    t: PropTypes.func,
  };

  static defaultProps = {
    loading: true,
  };

  renderTableRow = project => {
    return (
      <tr
        key={project.projectId}
        className={
          this.state.highlightedItem === project.projectId
            ? 'noselect active'
            : 'noselect'
        }
        onMouseEnter={() => {
          this.onHighlightItem(project.projectId);
        }}
        onClick={() => {
          this.onHighlightItem(project.projectId);
          this.props.onSelect(project);
        }}
      >
        <td>{project.name}</td>
        <td>{project.projectId}</td>
      </tr>
    );
  };

  onHighlightItem(project) {
    this.setState({ highlightedItem: project });
  }

  render() {
    const { loading, projects, filter, error } = this.props;

    if (error) {
      return <p>{error}</p>;
    }

    const loadingIcon = (
      <Icon name="circle-notch" className="loading-icon-spin loading-icon" />
    );

    if (loading) {
      return loadingIcon;
    }

    const lowerCaseFilter = filter.toLowerCase();
    const filteredProjects = projects.filter(project =>   
      typeof project.name  === 'string' &&
      (filter === "" || project.name.toLowerCase().includes(lowerCaseFilter))
    );

    const body = (
      <tbody id="ProjectList">
        {
          filteredProjects.map(this.renderTableRow)
        }
      </tbody>
    );

    return (
      <table id="tblProjectList" className="gcp-table table noselect">
        <thead>
          <tr>
            <th>{this.props.t('Project')}</th>
            <th>{this.props.t('ID')}</th>
          </tr>
        </thead>
        {projects && body}
      </table>
    );
  }
}

export default withTranslation('Common')(ProjectsList);
