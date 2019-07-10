import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';

export default class ProjectsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
      highlightedItem: null,
    };
  }

  static propTypes = {
    projects: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
  };
  static defaultProps = {};

  renderTableRow(project) {
    return (
      <tr
        key={project.projectId}
        className={
          this.state.highlightedItem === project.projectId
            ? 'studylistStudy noselect active'
            : 'studylistStudy noselect'
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
      </tr>
    );
  }

  onHighlightItem(project) {
    this.setState({ highlightedItem: project });
  }

  render() {
    return (
      <table id="tblProjectList" className="studyListToolbar table noselect">
        <tbody id="ProjectList">
          {this.props.projects.map(project => {
            return this.renderTableRow(project);
          })}
        </tbody>
      </table>
    );
  }
}
