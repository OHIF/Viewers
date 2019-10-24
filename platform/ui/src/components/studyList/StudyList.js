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
import isEqual from 'lodash.isequal';
import { withTranslation } from '../../utils/LanguageProvider';

const today = moment();
const lastWeek = moment().subtract(7, 'day');
const lastMonth = moment().subtract(1, 'month');
function getPaginationFragment(
  props,
  searchData,
  nextPageCb,
  prevPageCb,
  changeRowsPerPageCb
) {
  return (
    <PaginationArea
      pageOptions={props.pageOptions}
      currentPage={searchData.currentPage}
      nextPageFunc={nextPageCb}
      prevPageFunc={prevPageCb}
      onRowsPerPageChange={changeRowsPerPageCb}
      rowsPerPage={searchData.rowsPerPage}
      recordCount={props.studies.length}
    />
  );
}

function getTableMeta(translate) {
  return {
    patientName: {
      displayText: translate('PatientName'),
      sort: 0,
    },
    patientId: {
      displayText: translate('MRN'),
      sort: 0,
    },
    accessionNumber: {
      displayText: translate('AccessionNumber'),
      sort: 0,
    },
    studyDate: {
      displayText: translate('StudyDate'),
      inputType: 'date-range',
      sort: 0,
    },
    modalities: {
      displayText: translate('Modality'),
      sort: 0,
    },
    studyDescription: {
      displayText: translate('StudyDescription'),
      sort: 0,
    },
  };
}

function getNoListFragment(translate, studies, error, loading) {
  if (loading) {
    return (
      <div className="loading">
        <StudyListLoadingText />
      </div>
    );
  } else if (error) {
    return (
      <div className="notFound">
        {translate('There was an error fetching studies')}
      </div>
    );
  } else if (!studies.length) {
    return <div className="notFound">{translate('No matching results')}</div>;
  }
}

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
      this.setSearchData(key, event.target.value);
    };
  }

  setSearchData(key, value) {
    const searchData = { ...this.state.searchData };
    searchData[key] = value;

    if (!isEqual(searchData[key], this.state.searchData[key])) {
      this.setState({ ...this.state, searchData });
    }
  }

  setSearchDataBatch(keyValues) {
    const searchData = { ...this.state.searchData };

    Object.keys(keyValues).forEach(key => {
      searchData[key] = keyValues[key];
    });

    this.setState({ searchData });
  }

  async onInputKeydown(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      this.delayedSearch.cancel();
      // reset the page because user is doing a new search
      this.setSearchData('currentPage', 0);
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

  nextPage(currentPage) {
    currentPage = currentPage + 1;
    this.delayedSearch.cancel();
    this.setSearchData('currentPage', currentPage);
  }

  prevPage(currentPage) {
    currentPage = currentPage - 1;
    this.delayedSearch.cancel();
    this.setSearchData('currentPage', currentPage);
  }

  onRowsPerPageChange(rowsPerPage) {
    this.delayedSearch.cancel();
    this.setSearchDataBatch({ rowsPerPage, currentPage: 0 });
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
      this.setSearchData('sortData', { field, order });
    };
  }

  onHighlightItem(studyItemUid) {
    this.setState({ highlightedItem: studyItemUid });
  }

  getTableRow(study, index) {
    const trKey = `trStudy${index}${study.studyInstanceUid}`;

    if (!study) {
      return;
    }

    const getTableCell = (
      study,
      studyKey,
      emptyValue = '',
      emptyClass = ''
    ) => {
      const componentKey = `td${studyKey}`;
      const isValidValue = study && typeof study[studyKey] === 'string';
      let className = emptyClass;
      let value = emptyValue;

      if (isValidValue) {
        className = studyKey;
        value = study[studyKey];
      }

      return (
        <td key={componentKey} className={className}>
          {value}
        </td>
      );
    };

    return (
      <tr
        key={trKey}
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
        {getTableCell(
          study,
          'patientName',
          `(${this.props.t('Empty')})`,
          'emptyCell'
        )}
        {getTableCell(study, 'patientId')}
        {getTableCell(study, 'accessionNumber')}
        {getTableCell(study, 'studyDate')}
        {getTableCell(study, 'modalities')}
        {getTableCell(study, 'studyDescription')}
      </tr>
    );
  }

  componentDidUpdate(previousProps, previousState) {
    if (!isEqual(previousState.searchData, this.state.searchData)) {
      this.search();
    }
  }

  renderTableBody(noListFragment) {
    return !noListFragment && this.props.studies
      ? this.props.studies.map(this.getTableRow.bind(this))
      : null;
  }

  render() {
    const tableMeta = getTableMeta(this.props.t);

    // Apply sort
    const sortedFieldName = this.state.searchData.sortData.field;
    const sortedField = tableMeta[sortedFieldName];

    if (sortedField) {
      const sortOrder = this.state.searchData.sortData.order;
      sortedField.sort = sortOrder === 'asc' ? 1 : 2;
    }

    // Sort Icons
    const sortIcons = ['sort', 'sort-up', 'sort-down'];
    const noListFragment = getNoListFragment(
      this.props.t,
      this.props.studies,
      this.state.error,
      this.props.loading || this.state.loading
    );
    const tableBody = this.renderTableBody(noListFragment);
    const studiesNum = (this.props.studies && this.props.studies.length) || 0;

    return (
      <div className="StudyList">
        <div className="studyListToolbar clearfix">
          <div className="header pull-left">{this.props.t('StudyList')}</div>
          <div className="studyCount pull-right">{studiesNum}</div>
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
                                  this.setSearchDataBatch({
                                    studyDateFrom: startDate.toDate(),
                                    studyDateTo: endDate.toDate(),
                                  });
                                  this.setState({ focusedInput: false });
                                } else if (!startDate && !endDate) {
                                  this.setSearchDataBatch({
                                    studyDateFrom: null,
                                    studyDateTo: null,
                                  });
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
            <tbody id="studyListData">{tableBody}</tbody>
          </table>

          {noListFragment
            ? noListFragment
            : getPaginationFragment(
                this.props,
                this.state.searchData,
                this.nextPage,
                this.prevPage,
                this.onRowsPerPageChange
              )}
        </div>
      </div>
    );
  }
}

const connectedComponent = withTranslation('StudyList')(StudyList);
export { connectedComponent as StudyList };
