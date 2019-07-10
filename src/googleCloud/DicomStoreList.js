import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './googleCloud.css';

export default class DicomStoreList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      search: '',
    };
  }

  static propTypes = {
    stores: PropTypes.array,
    loading: PropTypes.bool,
    error: PropTypes.string,
    onSelect: PropTypes.func,
  };
  static defaultProps = {};

  renderTableRow(store) {
    return (
      <tr
        key={store.name}
        className={
          this.state.highlightedItem === store.name
            ? 'studylistStudy noselect active'
            : 'studylistStudy noselect'
        }
        onMouseEnter={() => {
          this.onHighlightItem(store.name);
        }}
        onClick={() => {
          this.props.onSelect(store);
        }}
      >
        <td className="project">{store.name.split('/')[7]}</td>
      </tr>
    );
  }

  onHighlightItem(store) {
    this.setState({ highlightedItem: store });
  }

  render() {
    return (
      <table id="tblStoreList" className="studyListToolbar table noselect">
        <tbody id="StoreList">
          {this.props.stores.map(store => {
            return this.renderTableRow(store);
          })}
        </tbody>
      </table>
    );
  }
}
