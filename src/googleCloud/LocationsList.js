import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';
export default class LocationsList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  static propTypes = {
    locations: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string,
    onSelect: PropTypes.func,
  };
  static defaultProps = {};

  renderTableRow(location) {
    return (
      <tr
        key={location.locationId}
        className={
          this.state.highlightedItem === location.locationId
            ? 'studylistStudy noselect active'
            : 'studylistStudy noselect'
        }
        onMouseEnter={() => {
          this.onHighlightItem(location.locationId);
        }}
        onClick={() => {
          this.props.onSelect(location);
        }}
      >
        <td>{location.name.split('/')[3]}</td>
      </tr>
    );
  }

  onHighlightItem(locationId) {
    this.setState({ highlightedItem: locationId });
  }

  render() {
    return (
      <table id="tblLocationList" className="studyListToolbar table noselect">
        <tbody id="LocationList">
          {this.props.locations.map(project => {
            return this.renderTableRow(project);
          })}
        </tbody>
      </table>
    );
  }
}
