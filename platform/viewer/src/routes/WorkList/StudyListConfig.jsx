import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { ConfigPointService, ConfigPointOp } from '../../../../core/src/services/ConfigPointService/ConfigPointService';

import {
  Icon,
  StudyListExpandedRow,
  Button,
  TooltipClipboard,
} from '@ohif/ui';

import i18n from '@ohif/i18n';

export default function StudyListConfig(props) {
  const { rowData, key, expandedRows, seriesInStudiesMap, appConfig, t, setExpandedRows } = props;
  const rowKey = key + 1;
  const isExpanded = expandedRows.some(k => k === rowKey);
  const {
    studyInstanceUid,
    accession,
    modalities,
    instances,
    description,
    date,
    time,
  } = rowData;
  const studyDate =
    date &&
    moment(date, ['YYYYMMDD', 'YYYY.MM.DD'], true).isValid() &&
    moment(date, ['YYYYMMDD', 'YYYY.MM.DD']).format('MMM-DD-YYYY');
  const studyTime =
    time &&
    moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).isValid() &&
    moment(time, ['HH', 'HHmm', 'HHmmss', 'HHmmss.SSS']).format('hh:mm A');
  const configPoint = props.configPoint || StudyListConfigPoint;

  console.warn("configPoint=", configPoint);
  const configPointRows = configPoint.tableColumns.map((column, colKey) => ({ ...column, content: column.content({ props, rowData, column }) }));
  return {
    row: [...configPointRows,
    {
      key: 'studyDate',
      content: (
        <div>
          {studyDate && <span className="mr-4">{studyDate}</span>}
          {studyTime && <span>{studyTime}</span>}
        </div>
      ),
      title: `${studyDate || ''} ${studyTime || ''}`,
      gridCol: 5,
    },
    {
      key: 'modality',
      content: modalities,
      title: modalities,
      gridCol: 3,
    },
    {
      key: 'accession',
      content: <TooltipClipboard>{accession}</TooltipClipboard>,
      gridCol: 3,
    },
    {
      key: 'instances',
      content: (
        <>
          <Icon
            name="group-layers"
            className={classnames('inline-flex mr-2 w-4', {
              'text-primary-active': isExpanded,
              'text-secondary-light': !isExpanded,
            })}
          />
          {instances}
        </>
      ),
      title: (instances || 0).toString(),
      gridCol: 4,
    },
    ],
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

const tooltipClipboardFunction = ({ rowData, column }) => (<TooltipClipboard>{rowData[column.key]}</TooltipClipboard>);

export const { StudyListConfigPoint, PatientListConfigPoint } = ConfigPointService.register([
  {
    configName: 'PatientListConfigPoint',
    configBase: {
      context: {
        tooltipClipboardFunction,
      },
      tableColumns: [
        {
          key: 'patientName',
          content: ({ rowData }) => rowData.patientName ? (
            <TooltipClipboard>{rowData.patientName}</TooltipClipboard>
          ) : (
            <span className="text-gray-700">(Empty)</span>
          ),
          gridCol: 4,
        },
        {
          key: 'mrn',
          content: tooltipClipboardFunction,
          gridCol: 3,
        },
      ],
    },
  },
  {
    configName: 'StudyListConfigPoint',
    configBase: 'PatientListConfigPoint',
    extension: {
      tableColumns: [
        ConfigPointOp.insertAt(3, {
          key: 'description',
          // This is a way to reference an exsiting function, as long
          // as it is available in the context.  This may still change TBD
          content: { _reference: 'tooltipClipboardFunction' },
          gridCol: 4,
        }),
      ],
    },
  },
]);
