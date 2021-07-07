import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';

import {
  Icon,
  StudyListExpandedRow,
  Button,
  TooltipClipboard,
} from '@ohif/ui';

import i18n from '@ohif/i18n';

export default function StudyListConfig({ rowData, key, expandedRows, seriesInStudiesMap, appConfig, t, setExpandedRows }) {
  const rowKey = key + 1;
  const isExpanded = expandedRows.some(k => k === rowKey);
  const {
    studyInstanceUid,
    accession,
    modalities,
    instances,
    description,
    mrn,
    patientName,
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

  return {
    row: [
      {
        key: 'patientName',
        content: patientName ? (
          <TooltipClipboard>{patientName}</TooltipClipboard>
        ) : (
          <span className="text-gray-700">(Empty)</span>
        ),
        gridCol: 4,
      },
      {
        key: 'mrn',
        content: <TooltipClipboard>{mrn}</TooltipClipboard>,
        gridCol: 3,
      },
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
        key: 'description',
        content: <TooltipClipboard>{description}</TooltipClipboard>,
        gridCol: 4,
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
