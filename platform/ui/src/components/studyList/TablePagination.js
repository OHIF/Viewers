import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import './PaginationArea.styl';
import { withTranslation } from '../../contextProviders';

class TablePagination extends PureComponent {
  static defaultProps = {
    pageOptions: [5, 10, 25, 50, 100],
    rowsPerPage: 25,
    currentPage: 0,
  };

  static propTypes = {
    /* Values to show in "Rows per page" select dropdown */
    pageOptions: PropTypes.array,
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
          <React.Fragment>
            <ul className="pagination-control no-margins">
              <li className="page-item prev">
                <button
                  onClick={this.prevPage}
                  disabled={this.props.currentPage === 0}
                  className="btn page-link"
                >
                  {this.props.t('Previous')}
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
                  {this.props.t('Next')}
                </button>
              </li>
            </ul>
          </React.Fragment>
        </div>
      </div>
    );
  }

  renderRowsPerPageDropdown() {
    return (
      <div className="form-inline form-group rows-per-page">
        <span>{this.props.t('Show')}</span>
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
        <span>{this.props.t('RowsPerPage')}</span>
      </div>
    );
  }

  render() {
    return (
      <div className="pagination-area">
        <div className="rows-dropdown">{this.renderRowsPerPageDropdown()}</div>
        <div className="pagination-buttons">
          <div className="form-inline form-group page-number pull-right">
            {this.renderPaginationButtons()}
          </div>
        </div>
      </div>
    );
  }
}

const connectedComponent = withTranslation('Common')(TablePagination);
export { connectedComponent as TablePagination };
