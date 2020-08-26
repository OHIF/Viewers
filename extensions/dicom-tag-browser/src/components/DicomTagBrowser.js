import React from 'react';
import { classes, utils } from '@ohif/core';
import dcmjs from 'dcmjs';
import './DicomTagBrowser.css';

const { ImageSet } = classes;

const { DicomMetaDictionary } = dcmjs.data;

const { nameMap, dictionary } = DicomMetaDictionary;

//const { StackManager } = utils;

// TODO -> Allow you to swithc displaySet and read the headers.

const DicomTagBrowser = ({ displaySets, activeDisplaySetInstanceUID }) => {
  // const activeDisplaySet = displaySets.find(
  //   ds => ds.displaySetInstanceUID === activeDisplaySetInstanceUID
  // );

  // TEMP TO TEST SEQUENCES.

  const activeDisplaySet = displaySets.find(ds => ds.Modality === 'SEG');

  debugger;

  let metadata;

  if (activeDisplaySet instanceof ImageSet) {
    let activeImageIndex = 0;

    // TODO -> We can't use the stackmanager for this, the currentImageIdIndex is actually controlled
    // By a wrapper in the cornerstone viewport :thinking:.

    //   debugger;

    //   const stack = StackManager.findStack(activeDisplaySetInstanceUID);

    //   debugger;

    const image = activeDisplaySet.images[activeImageIndex];

    metadata = image.getData().metadata;
  } else {
    metadata = activeDisplaySet.metadata;
  }

  console.log(DicomMetaDictionary);

  const rows = getRows(metadata);
  debugger;

  return (
    <div className="dicom-tag-browser">
      <table>
        <tr>
          <th>Tag</th>
          <th>Value Representation</th>
          <th>Keyword</th>
          <th>Value</th>
        </tr>
        {rows.map(row => (
          <tr>
            <td className="dicom-tag-browser-table-center">{row[0]}</td>
            <td className="dicom-tag-browser-table-center">{row[1]}</td>
            <td>{row[2]}</td>
            <td>{row[3]}</td>
          </tr>
        ))}
      </table>
    </div>
  );
};

function getRows(metadata, depth = 0) {
  const keywords = Object.keys(metadata);

  const rows = [];

  for (let i = 0; i < keywords.length; i++) {
    let keyword = keywords[i];

    if (keyword === '_vrMap') {
      continue;
    }

    const tagInfo = nameMap[keyword];

    let value = metadata[keyword];

    if (tagInfo && tagInfo.vr === 'SQ') {
      debugger;
      // TODO

      rows.push([tagInfo.tag, tagInfo.vr, 'TODO SEQUENCES', keyword]);
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
      rows.push([tagInfo.tag, tagInfo.vr, keyword, value]);
    } else {
      // Private tag
      const tag = `(${keyword.substring(0, 4)},${keyword.substring(4, 8)})`;

      rows.push([tag, '', 'Private Tag', value]);
    }

    // Tag, Type, Value, Keyword
  }

  return rows;
}

function getSequence(item, depth = 1) {}

export default DicomTagBrowser;
