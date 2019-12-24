import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';
import { withTranslation } from 'react-i18next';
import { Icon } from '@ohif/ui';

class DatasetsList extends Component {
  state = {
    search: '',
  };

  static propTypes = {
    datasets: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string,
    onSelect: PropTypes.func,
  };

  static defaultProps = {
    loading: true,
  };

  renderTableRow = dataset => {
    return (
      <tr
        key={dataset.name}
        className={
          this.state.highlightedItem === dataset.name
            ? 'noselect active'
            : 'noselect'
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
  };

  onHighlightItem(dataset) {
    this.setState({ highlightedItem: dataset });
  }

  render() {
    const { loading, datasets, filter, error } = this.props;
    
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
      <tbody id="DatasetList">
        {datasets.filter(dataset => (dataset.name.split('/')[5].toLowerCase().includes(filter.toLowerCase()) || filter=="")).map(this.renderTableRow)}
      </tbody>
    );

    return (
      <table id="tblDatasetList" className="gcp-table table noselect">
        <thead>
          <tr>
            <th>{this.props.t('Dataset')}</th>
          </tr>
        </thead>
        {datasets && body}
      </table>
    );
  }
}

export default withTranslation('Common')(DatasetsList);
