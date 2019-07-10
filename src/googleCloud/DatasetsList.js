import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';

export default class DatasetsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  static propTypes = {
    datasets: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string,
    onSelect: PropTypes.func,
  };
  static defaultProps = {};

  renderTableRow(dataset) {
    return (
      <tr
        key={dataset.name}
        className={
          this.state.highlightedItem === dataset.name
            ? 'studylistStudy noselect active'
            : 'studylistStudy noselect'
        }
        onMouseEnter={() => {
          this.onHighlightItem(dataset.name);
        }}
        onClick={() => {
          this.props.onSelect(dataset);
        }}
      >
        <td>{dataset.name.split('/')[5]}</td>
      </tr>
    );
  }

  onHighlightItem(dataset) {
    this.setState({ highlightedItem: dataset });
  }

  render() {
    return (
      <table id="tblDatasetList" className="studyListToolbar table noselect">
        <tbody id="DatasetList">
          {this.props.datasets.map(dataset => {
            return this.renderTableRow(dataset);
          })}
        </tbody>
      </table>
    );
  }
}
