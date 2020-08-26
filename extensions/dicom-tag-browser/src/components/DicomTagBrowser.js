import React, { useState, useCallback } from 'react';
import { classes } from '@ohif/core';
import dcmjs from 'dcmjs';
import DicomBrowserSelect from './DicomBrowserSelect';
import moment from 'moment';
import './DicomTagBrowser.css';
import DicomBrowserSelectItem from './DicomBrowserSelectItem';
import { isDebuggerStatement } from 'typescript';

const { ImageSet } = classes;
const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;

//const { StackManager } = utils;

// TODO -> Allow you to swithc displaySet and read the headers.

const DicomTagBrowser = ({ displaySets, displaySetInstanceUID }) => {
  const [
    activeDisplaySetInstanceUID,
    setActiveDisplaySetInstanceUID,
  ] = useState(displaySetInstanceUID);
  const [activeInstance, setActiveInstance] = useState(0);

  const activeDisplaySet = displaySets.find(
    ds => ds.displaySetInstanceUID === activeDisplaySetInstanceUID
  );

  const getDisplaySetList = useCallback(() => {
    return displaySets.map(displaySet => {
      const {
        displaySetInstanceUID,
        SeriesDate,
        SeriesTime,
        SeriesNumber,
        SeriesDescription,
        Modality,
      } = displaySet;

      /* Map to display representation */
      const dateStr = `${SeriesDate}:${SeriesTime}`.split('.')[0];
      const date = moment(dateStr, 'YYYYMMDD:HHmmss');
      const displayDate = date.format('ddd, MMM Do YYYY');

      return {
        value: displaySetInstanceUID,
        title: `${SeriesNumber} (${Modality}): ${SeriesDescription}`,
        description: displayDate,
        onClick: () => {
          setActiveDisplaySetInstanceUID(displaySetInstanceUID);
        },
      };
    });
  }, [displaySets]);

  let metadata;

  if (activeDisplaySet instanceof ImageSet) {
    const image = activeDisplaySet.images[activeInstance];

    metadata = image.getData().metadata;
  } else {
    metadata = activeDisplaySet.metadata;
  }

  debugger;

  return (
    <div>
      <DicomBrowserSelect
        value={activeDisplaySetInstanceUID}
        formatOptionLabel={DicomBrowserSelectItem}
        options={getDisplaySetList()}
      />
      <DicomTagTable instanceMetadata={metadata}></DicomTagTable>
    </div>
  );
};

function DicomTagTable({ instanceMetadata }) {
  const rows = getRows(instanceMetadata);

  return (
    <div className="dicom-tag-browser-table">
      <table>
        <tr>
          <th>Tag</th>
          <th>Value Representation</th>
          <th>Keyword</th>
          <th>Value</th>
        </tr>
        {rows.map(row => (
          <tr>
            <td>{row[0]}</td>
            <td className="dicom-tag-browser-table-center">{row[1]}</td>
            <td>{row[2]}</td>
            <td>{row[3]}</td>
          </tr>
        ))}
      </table>
    </div>
  );
}

function getRows(metadata, depth = 0) {
  // Tag, Type, Value, Keyword

  const keywords = Object.keys(metadata);

  let tagIndent = '';

  for (let i = 0; i < depth; i++) {
    tagIndent += '>';
  }

  const rows = [];

  for (let i = 0; i < keywords.length; i++) {
    let keyword = keywords[i];

    if (keyword === '_vrMap') {
      continue;
    }

    const tagInfo = nameMap[keyword];

    let value = metadata[keyword];

    if (tagInfo && tagInfo.vr === 'SQ') {
      const sequenceAsArray = toArray(value);

      // Push line defining the sequence
      rows.push([`${tagIndent}${tagInfo.tag}`, tagInfo.vr, keyword, '']);

      sequenceAsArray.forEach(item => {
        const sequenceRows = getRows(item, depth + 1);

        sequenceRows.forEach(row => {
          rows.push(row);
        });
      });

      continue;
    }

    if (Array.isArray(value)) {
      value = value.join('\\');
    }

    if (typeof value === 'number') {
      value = value.toString();
    }

    if (typeof value !== 'string') {
      if (value === null) {
        value = ' ';
      } else {
        if (typeof value === 'object') {
          if (value.InlineBinary) {
            value = 'Inline Binary';
          } else if (value.BulkDataURI) {
            value = `Bulk Data URI`; //: ${value.BulkDataURI}`;
          } else if (value.Alphabetic) {
            value = value.Alphabetic;
          } else {
            debugger;
          }
        } else {
          debugger;
        }
      }
    }

    // Remove retired tags
    keyword = keyword.replace('RETIRED_', '');

    if (tagInfo) {
      rows.push([`${tagIndent}${tagInfo.tag}`, tagInfo.vr, keyword, value]);
    } else {
      // Private tag
      const tag = `(${keyword.substring(0, 4)},${keyword.substring(4, 8)})`;

      rows.push([`${tagIndent}${tag}`, '', 'Private Tag', value]);
    }
  }

  return rows;
}

function toArray(objectOrArray) {
  return Array.isArray(objectOrArray) ? objectOrArray : [objectOrArray];
}

export default DicomTagBrowser;
