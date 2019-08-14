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
    if (this.props.error) {
      return <p>{this.props.error}</p>;
    }

    const loadingIcon = (
      <Icon name="circle-notch" className="loading-icon-spin loading-icon" />
    );

    if (this.props.loading) {
      return loadingIcon;
    }

    const body = (
      <tbody id="ProjectList">
        {this.props.projects.map(this.renderTableRow)}
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
        {this.props.projects && body}
      </table>
    );
  }
}

export default withTranslation('Common')(ProjectsList);
