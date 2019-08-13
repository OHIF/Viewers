import './StudyList.styl';

import React, { Component } from 'react';

import CustomDateRangePicker from './CustomDateRangePicker.js';
import { Icon } from './../../elements/Icon';
import { PaginationArea } from './PaginationArea.js';
import PropTypes from 'prop-types';
import { StudyListLoadingText } from './StudyListLoadingText.js';
import { StudylistToolbar } from './StudyListToolbar.js';
import { isInclusivelyBeforeDay } from 'react-dates';
import moment from 'moment';
import debounce from 'lodash.debounce';
import { withTranslation } from '../../utils/LanguageProvider';

const today = moment();
const lastWeek = moment().subtract(7, 'day');
const lastMonth = moment().subtract(1, 'month');

class StudyList extends Component {
  static propTypes = {
    studies: PropTypes.array.isRequired,
    onSelectItem: PropTypes.func.isRequired,
    onSearch: PropTypes.func.isRequired,
    currentPage: PropTypes.number,
    rowsPerPage: PropTypes.number,
    studyListDateFilterNumDays: PropTypes.number,
    studyListFunctionsEnabled: PropTypes.bool,
    defaultSort: PropTypes.shape({
      field: PropTypes.string.isRequired,
      order: PropTypes.oneOf(['desc', 'asc']).isRequired,
    }),
    onImport: PropTypes.func,
    pageOptions: PropTypes.array,
  };

  static defaultProps = {
    currentPage: 0,
    rowsPerPage: 25,
    studyListDateFilterNumDays: 7,
  };

  static studyDatePresets = [
    {
      text: 'Today',
      start: today,
      end: today,
    },
    {
      text: 'Last 7 days',
      start: lastWeek,
      end: today,
    },
    {
      text: 'Last 30 days',
      start: lastMonth,
      end: today,
    },
  ];

  constructor(props) {
    super(props);

    const sortData = {
      field: undefined,
      order: undefined,
    };

    // init from props
    if (props.defaultSort) {
      sortData.field = props.defaultSort.field;
      // todo: -1, 0, 1?
      sortData.order = props.defaultSort.order; // asc, desc
    }

    this.defaultStartDate = moment().subtract(
      this.props.studyListDateFilterNumDays,
      'days'
    );
    this.defaultEndDate = moment();

    this.state = {
      loading: false,
      error: false,
      searchData: {
        sortData,
        currentPage: this.props.currentPage,
        rowsPerPage: this.props.rowsPerPage,
        studyDateFrom: this.defaultStartDate,
        studyDateTo: this.defaultEndDate,
      },
      highlightedItem: '',
    };

    this.getChangeHandler = this.getChangeHandler.bind(this);
    this.getBlurHandler = this.getBlurHandler.bind(this);
    this.onInputKeydown = this.onInputKeydown.bind(this);
    this.nextPage = this.nextPage.bind(this);
    this.prevPage = this.prevPage.bind(this);
    this.onRowsPerPageChange = this.onRowsPerPageChange.bind(this);
    this.delayedSearch = debounce(this.search, 250);
  }

  getChangeHandler(key) {
    return event => {
      this.delayedSearch.cancel();
      this.setSearchData(key, event.target.value, this.delayedSearch);
    };
  }

  getBlurHandler(key) {
    return event => {
      this.delayedSearch.cancel();
      this.setSearchData(key, event.target.value, this.search);
    };
  }

  setSearchData(key, value, callback) {
    const searchData = this.state.searchData;
    searchData[key] = value;
    this.setState({ searchData }, callback);
  }

  setSearchDataBatch(keyValues, callback) {
    const searchData = this.state.searchData;

    Object.keys(keyValues).forEach(key => {
      searchData[key] = keyValues[key];
    });

    this.setState({ searchData }, callback);
  }

  async onInputKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      this.delayedSearch.cancel();
      // reset the page because user is doing a new search
      this.setSearchData('currentPage', 0, this.search);
    }
  }

  async search() {
    try {
      this.setState({ loading: true, error: false });
      await this.props.onSearch(this.state.searchData);
    } catch (error) {
      this.setState({ error: true });
      throw new Error(error);
    } finally {
      this.setState({ loading: false });
    }
  }

  renderNoMachingResults() {
    if (!this.props.studies.length && !this.state.error) {
      return <div className="notFound">No matching results</div>;
    }
  }

  renderHasError() {
    if (this.state.error) {
      return (
        <div className="notFound">There was an error fetching studies</div>
      );
    }
  }

  renderIsLoading() {
    if (this.state.loading) {
      return (
        <div className="loading">
          <StudyListLoadingText />
        </div>
      );
    }
  }

  nextPage(currentPage) {
    currentPage = currentPage + 1;
    this.delayedSearch.cancel();
    this.setSearchData('currentPage', currentPage, this.search);
  }

  prevPage(currentPage) {
    currentPage = currentPage - 1;
    this.delayedSearch.cancel();
    this.setSearchData('currentPage', currentPage, this.search);
  }

  onRowsPerPageChange(rowsPerPage) {
    this.delayedSearch.cancel();
    this.setSearchDataBatch({ rowsPerPage, currentPage: 0 }, this.search);
  }

  onSortClick(field) {
    return () => {
      let order;
      const sort = this.state.searchData.sortData;
      const isSortedField = sort.field === field;

      if (isSortedField) {
        if (sort.order === 'asc') {
          order = 'desc';
        } else {
          order = undefined;
          field = undefined;
        }
      } else {
        order = 'asc';
      }

      this.delayedSearch.cancel();
      this.setSearchData('sortData', { field, order }, this.search);
    };
  }

  onHighlightItem(studyItemUid) {
    this.setState({ highlightedItem: studyItemUid });
  }

  renderTableRow(study) {
    return (
      <tr
        key={study.studyInstanceUid}
        className={
          this.state.highlightedItem === study.studyInstanceUid
            ? 'studylistStudy noselect active'
            : 'studylistStudy noselect'
        }
        onMouseDown={event => {
          // middle/wheel click
          if (event.button === 1) {
            this.props.onSelectItem(study.studyInstanceUid);
          }
        }}
        onClick={() => {
          this.onHighlightItem(study.studyInstanceUid);
          this.props.onSelectItem(study.studyInstanceUid);
        }}
      >
        <td className={study.patientName ? 'patientName' : 'emptyCell'}>
          {study.patientName || `(${this.props.t('Empty')})`}
        </td>

        <td className="patientId">{study.patientId}</td>
        <td className="accessionNumber">{study.accessionNumber}</td>
        <td className="studyDate">{study.studyDate}</td>
        <td className="modalities">{study.modalities}</td>
        <td className="studyDescription">{study.studyDescription}</td>
      </tr>
    );
  }

  render() {
    const tableMeta = {
      patientName: {
        displayText: this.props.t('PatientName'),
        sort: 0,
      },
      patientId: {
        displayText: this.props.t('MRN'),
        sort: 0,
      },
      accessionNumber: {
        displayText: this.props.t('AccessionNumber'),
        sort: 0,
      },
      studyDate: {
        displayText: this.props.t('StudyDate'),
        inputType: 'date-range',
        sort: 0,
      },
      modalities: {
        displayText: this.props.t('Modality'),
        sort: 0,
      },
      studyDescription: {
        displayText: this.props.t('StudyDescription'),
        sort: 0,
      },
    };

    // Apply sort
    const sortedFieldName = this.state.searchData.sortData.field;
    const sortedField = tableMeta[sortedFieldName];

    if (sortedField) {
      const sortOrder = this.state.searchData.sortData.order;
      sortedField.sort = sortOrder === 'asc' ? 1 : 2;
    }

    // Sort Icons
    const sortIcons = ['sort', 'sort-up', 'sort-down'];

    return (
      <div className="StudyList">
        <div className="studyListToolbar clearfix">
          <div className="header pull-left">{this.props.t('StudyList')}</div>
          <div className="studyCount pull-right">
            {this.props.studies.length}
          </div>
          <div className="pull-right">
            {this.props.studyListFunctionsEnabled ? (
              <StudylistToolbar onImport={this.props.onImport} />
            ) : null}
          </div>
          {this.props.children}
        </div>
        <div className="theadBackground" />
        <div id="studyListContainer">
          <table id="tblStudyList" className="studylistResult table noselect">
            <thead>
              <tr>
                {Object.keys(tableMeta).map((fieldName, i) => {
                  const field = tableMeta[fieldName];

                  return (
                    <React.Fragment key={i}>
                      <th className={fieldName}>
                        <div
                          id={`_${fieldName}`}
                          className="display-text"
                          onClick={this.onSortClick(fieldName)}
                        >
                          <span>{field.displayText}</span>
                          <Icon
                            name={sortIcons[field.sort]}
                            style={{ fontSize: '12px' }}
                          />
                        </div>
                        {!field.inputType && (
                          <input
                            type="text"
                            className="form-control studylist-search"
                            id={fieldName}
                            value={this.state[fieldName]}
                            onKeyDown={this.onInputKeydown}
                            onChange={this.getChangeHandler(fieldName)}
                            onBlur={this.getBlurHandler(fieldName)}
                          />
                        )}
                        {field.inputType === 'date-range' && (
                          <div style={{ display: 'block' }}>
                            <CustomDateRangePicker
                              presets={StudyList.studyDatePresets}
                              showClearDates={true}
                              startDateId="studyListStartDate"
                              endDateId="studyListEndDate"
                              startDate={this.defaultStartDate}
                              endDate={this.defaultEndDate}
                              hideKeyboardShortcutsPanel={true}
                              anchorDirection="left"
                              isOutsideRange={day =>
                                !isInclusivelyBeforeDay(day, moment())
                              }
                              onDatesChange={({
                                startDate,
                                endDate,
                                preset = false,
                              }) => {
                                if (
                                  startDate &&
                                  endDate &&
                                  (this.state.focusedInput === 'endDate' ||
                                    preset)
                                ) {
                                  this.setSearchDataBatch(
                                    {
                                      studyDateFrom: startDate.toDate(),
                                      studyDateTo: endDate.toDate(),
                                    },
                                    this.search
                                  );
                                  this.setState({ focusedInput: false });
                                } else if (!startDate && !endDate) {
                                  this.setSearchDataBatch(
                                    {
                                      studyDateFrom: null,
                                      studyDateTo: null,
                                    },
                                    this.search
                                  );
                                }
                              }}
                              focusedInput={this.state.focusedInput}
                              onFocusChange={focusedInput => {
                                this.setState({ focusedInput });
                              }}
                            />
                          </div>
                        )}
                      </th>
                    </React.Fragment>
                  );
                })}
              </tr>
            </thead>
            <tbody id="studyListData">
              {this.props.studies.map(study => {
                return this.renderTableRow(study);
              })}
            </tbody>
          </table>

          {this.renderIsLoading()}
          {this.renderHasError()}
          {this.renderNoMachingResults()}

          <PaginationArea
            pageOptions={this.props.pageOptions}
            currentPage={this.state.searchData.currentPage}
            nextPageFunc={this.nextPage}
            prevPageFunc={this.prevPage}
            onRowsPerPageChange={this.onRowsPerPageChange}
            rowsPerPage={this.state.searchData.rowsPerPage}
            recordCount={this.props.studies.length}
          />
        </div>
      </div>
    );
  }
}

const connectedComponent = withTranslation('StudyList')(StudyList);
export { connectedComponent as StudyList };
