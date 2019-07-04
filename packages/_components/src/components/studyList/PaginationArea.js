import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './PaginationArea.styl';

class PaginationArea extends PureComponent {
  static defaultProps = {
    pageOptions: [5, 10, 25, 50, 100],
    rowsPerPage: 25,
    currentPage: 0,
  };

  static propTypes = {
    pageOptions: PropTypes.array.isRequired,
    rowsPerPage: PropTypes.number.isRequired,
    currentPage: PropTypes.number.isRequired,
    nextPageFunc: PropTypes.func,
    prevPageFunc: PropTypes.func,
    onRowsPerPageChange: PropTypes.func,
    recordCount: PropTypes.number.isRequired,
  };

  nextPage = () => {
    this.props.nextPageFunc(this.props.currentPage);
  };

  prevPage = () => {
    this.props.prevPageFunc(this.props.currentPage);
  };

  onRowsPerPageChange = event => {
    this.props.onRowsPerPageChange(parseInt(event.target.value));
  };

  renderPaginationButtons() {
    return (
      <div className="col-xs-8 col-sm-9 col-md-9">
        <div className="form-inline form-group page-buttons noselect">
          <label>
            <ul className="pagination-control no-margins">
              <li className="page-item prev">
                <button
                  onClick={this.prevPage}
                  disabled={this.props.currentPage === 0}
                  className="btn page-link"
                >
                  Previous
                </button>
              </li>
              <li className="page-item next">
                <button
                  onClick={this.nextPage}
                  disabled={
                    this.props.recordCount === 0 ||
                    this.props.rowsPerPage > this.props.recordCount
                  }
                  className="btn page-link"
                >
                  Next
                </button>
              </li>
            </ul>
          </label>
        </div>
      </div>
    );
  }

  renderRowsPerPageDropdown() {
    return (
      <div className="form-inline form-group rows-per-page">
        <span>Show</span>
        <select
          onChange={this.onRowsPerPageChange}
          defaultValue={this.props.rowsPerPage}
        >
          {this.props.pageOptions.map(pageNumber => {
            return (
              <option key={pageNumber} value={pageNumber}>
                {pageNumber}
              </option>
            );
          })}
        </select>
        <span>rows per page</span>
      </div>
    );
  }

  render() {
    return (
      <div name="paginationArea">
        <div className="pagination-area">
          <div className="row">
            <div className="col-xs-4 col-sm-3 col-md-3">
              {this.renderRowsPerPageDropdown()}
            </div>
            <div className="col-xs-8 col-sm-9 col-md-9">
              <div className="form-inline form-group page-number pull-right">
                {this.renderPaginationButtons()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export { PaginationArea };
