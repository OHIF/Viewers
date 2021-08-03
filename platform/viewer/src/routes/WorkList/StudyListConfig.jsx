import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { ConfigPoint, ReferenceOp, SortOp } from 'config-point';

import {
  Icon,
  StudyListExpandedRow,
  Button,
  TooltipClipboard,
} from '@ohif/ui';

import i18n from '@ohif/i18n';

export default function StudyListConfig(props) {
  const { rowData, key, expandedRows, seriesInStudiesMap, appConfig, t, setExpandedRows, configPoint = StudyListConfigPoint } = props;
  const rowKey = key + 1;
  const isExpanded = expandedRows.some(k => k === rowKey);
  const { studyInstanceUid } = rowData;

  const rowArgs = { isExpanded, props, rowData };
  const row = configPoint.tableColumns.map((column, colKey) => {
    const formattedArgs = column.formatArgs && column.formatArgs({ ...rowArgs, column, });
    let ret = ({ ...column, content: column.content({ ...rowArgs, column, formattedArgs }) })
    if (typeof (column.title) === 'function') ret.title = column.title({ ...rowArgs, column, formattedArgs });
    return ret;
  });
  return {
    row,
    expandedContent: (
      <StudyListExpandedRow
        seriesTableColumns={{
          description: 'Description',
          seriesNumber: 'Series',
          modality: 'Modality',
          instances: 'Instances',
        }}
        seriesTableDataSource={
          seriesInStudiesMap.has(studyInstanceUid)
            ? seriesInStudiesMap.get(studyInstanceUid).map(s => {
              return {
                description: s.description || '(empty)',
                seriesNumber: s.seriesNumber || '',
                modality: s.modality || '',
                instances: s.numSeriesInstances || '',
              };
            })
            : []
        }
      >
        {appConfig.modes.map((mode, i) => {
          const isFirst = i === 0;

          // TODO: Modes need a default/target route? We mostly support a single one for now.
          // We should also be using the route path, but currently are not
          // mode.id
          // mode.routes[x].path
          // Don't specify default data source, and it should just be picked up... (this may not currently be the case)
          // How do we know which params to pass? Today, it's just StudyInstanceUIDs
          return (
            <Link
              key={i}
              to={`${mode.id}?StudyInstanceUIDs=${studyInstanceUid}`}
            // to={`${mode.id}/dicomweb?StudyInstanceUIDs=${studyInstanceUid}`}
            >
              <Button
                rounded="full"
                variant="contained" // outlined
                disabled={false}
                endIcon={<Icon name="launch-arrow" />} // launch-arrow | launch-info
                className={classnames('font-bold', { 'ml-2': !isFirst })}
                onClick={() => { }}
              >
                {t(`Modes:${mode.displayName}`)}
              </Button>
            </Link>
          );
        })}
      </StudyListExpandedRow>
    ),
    onClickRow: () =>
      setExpandedRows(s =>
        isExpanded ? s.filter(n => rowKey !== n) : [...s, rowKey]
      ),
    isExpanded,
  };
}

const tooltipClipboardFunction = ({ rowData, column }) => (<TooltipClipboard>{rowData[column.keyVar || column.key]}</TooltipClipboard>);

const titleDateTime = ({ formattedArgs }) => `${formattedArgs.date || ''} ${formattedArgs.Time || ''}`;

const titleKeyVar = ({ column, rowData }) => rowData[column.keyVar];

const rowDateTime = ({ formattedArgs }) => (
  <div>
    {formattedArgs.date && <span className="mr-4">{formattedArgs.date}</span>}
    {formattedArgs.time && <span>{formattedArgs.time}</span>}
  </div>
);

const contentInstances = ({ rowData, isExpanded }) => (
  <>
    <Icon
      name="group-layers"
      className={classnames('inline-flex mr-2 w-4', {
        'text-primary-active': isExpanded,
        'text-secondary-light': !isExpanded,
      })}
    />
    {rowData.instances}
  </>
);

const titleNumber = ({ rowData, column }) => (rowData[column.keyVar || column.key] || 0).toString();

const dateFormatArgs = ({ column, rowData }) => {
  const dateSrc = column.dateKey ? rowData[column.dateKey] : rowData.date;
  const timeSrc = column.timeKey ? rowData[column.timeKey] : rowData.time;
  const date =
    dateSrc &&
    moment(dateSrc, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
    moment(dateSrc, ['YYYYMMDD', 'YYYY.MM.DD']).format('MMM-DD-YYYY');
  const time =
    timeSrc &&
    moment(timeSrc, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).isValid() &&
    moment(timeSrc, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).format('hh:mm A');
  return { date, time };
};

export const { StudyListConfigPoint, PatientListConfigPoint } = ConfigPoint.register([
  {
    configName: 'PatientListConfigPoint',
    configBase: {
      tooltipClipboardFunction,
      titleDateTime,
      titleKeyVar,
      dateFormatArgs,
      rowDateTime,
      contentInstances,
      titleNumber,
      tableColumns: SortOp.createSort('tableColumnSrc', 'priority'),
      tableColumnSrc: {
        patientName: {
          key: 'patientName',
          content: ({ rowData }) => rowData.patientName ? (
            <TooltipClipboard>{rowData.patientName}</TooltipClipboard>
          ) : (
            <span className="text-gray-700">(Empty)</span>
          ),
          priority: 100,
          gridCol: 4,
        },
        mrn: {
          key: 'mrn',
          content: tooltipClipboardFunction,
          priority: 200,
          gridCol: 3,
        },
      },
    },
  },
  {
    configName: 'StudyListConfigPoint',
    configBase: 'PatientListConfigPoint',
    extension: {
      tableColumnSrc: {
        studyDate: {
          key: 'studyDate',
          content: rowDateTime,
          title: titleDateTime,
          formatArgs: dateFormatArgs,
          priority: 1000,
          gridCol: 5,
        },
        description: {
          key: 'description',
          // This is a way to reference an exsiting function, as long
          // as it is available in the context.  It is equivalent to a simple
          // object definition, as shown below
          content: ReferenceOp.createCurrent('tooltipClipboardFunction'),
          priority: 1100,
          gridCol: 4,
        },
        modality: {
          key: 'modality',
          keyVar: 'modalities',
          content: { configOperation: 'reference', reference: 'tooltipClipboardFunction' },
          title: titleKeyVar,
          priority: 1200,
          gridCol: 3,
        },
        accession: {
          key: 'accession',
          content: tooltipClipboardFunction,
          priority: 1300,
          gridCol: 3,
        },
        instances: {
          key: 'instances',
          content: contentInstances,
          title: titleNumber,
          priority: 1400,
          gridCol: 4,
        },
      },
    },
  },
]);

// TODO - figure out a better way to do this
window.ConfigPoint = ConfigPoint;
// To move the column
// ConfigPoint.register({configName: 'StudyListConfigPoint',extension: {tableColumnSrc: {instances: { priority: 300, }}}});
// or to remove the column:
// ConfigPoint.register({configName: 'StudyListConfigPoint',extension: {tableColumnSrc: {instances: { priority: null, }}}});
// Adding a column also requires adding data values to the query, which currently isn't supported
