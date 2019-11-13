import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';
import { withTranslation } from 'react-i18next';
import { Icon } from '@ohif/ui';

class LocationsList extends Component {
  state = {
    search: '',
  };

  static propTypes = {
    locations: PropTypes.array,
    loading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    onSelect: PropTypes.func,
  };

  static defaultProps = {
    loading: true,
  };

  renderTableRow = location => {
    return (
      <tr
        key={location.locationId}
        className={
          this.state.highlightedItem === location.locationId
            ? 'noselect active'
            : 'noselect'
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
  };

  onHighlightItem(locationId) {
    this.setState({ highlightedItem: locationId });
  }

  render() {
    const { loading, locations, filter, error } = this.props;

    if (error) {
      return <p>{error}</p>;
    }

    const loadingIcon = (
      <Icon name="circle-notch" className="loading-icon-spin loading-icon" />
    );

    if (loading) {
      return loadingIcon;
    }

    const body = (
      <tbody id="LocationList">
        {locations.filter(location => (location.name.split('/')[3].toLowerCase().includes(filter.toLowerCase()) || filter=="")).map(this.renderTableRow)}
      </tbody>
    );

    return (
      <table id="tblLocationList" className="gcp-table table noselect">
        <thead>
          <tr>
            <th>{this.props.t('Location')}</th>
          </tr>
        </thead>
        {locations && body}
      </table>
    );
  }
}

export default withTranslation('Common')(LocationsList);
