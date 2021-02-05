import React, { useState, useEffect } from 'react';
import { classes, cornerstone as OHIFCornerstone } from '@ohif/core';
import { Range } from '@ohif/ui';
import dcmjs from 'dcmjs';
import DicomBrowserSelect from './DicomBrowserSelect';
import moment from 'moment';
import './DicomTagBrowser.css';
import DicomBrowserSelectItem from './DicomBrowserSelectItem';

const { ImageSet } = classes;
const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;

const { metadataProvider } = OHIFCornerstone;

const DicomTagBrowser = ({ displaySets, displaySetInstanceUID }) => {
  const [
    activeDisplaySetInstanceUID,
    setActiveDisplaySetInstanceUID,
  ] = useState(displaySetInstanceUID);
  const [activeInstance, setActiveInstance] = useState(0);
  const [tags, setTags] = useState([]);
  const [meta, setMeta] = useState('');
  const [instanceList, setInstanceList] = useState([]);
  const [displaySetList, setDisplaySetList] = useState([]);
  const [isImageStack, setIsImageStack] = useState(false);

  useEffect(() => {
    const activeDisplaySet = displaySets.find(
      ds => ds.displaySetInstanceUID === activeDisplaySetInstanceUID
    );

    const newDisplaySetList = displaySets.map(displaySet => {
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
          setActiveInstance(0);
        },
      };
    });

    let metadata;
    const isImageStack = activeDisplaySet instanceof ImageSet;

    let selectedInstanceValue;
    let instanceList;

    if (isImageStack) {
      const { images } = activeDisplaySet;
      const image = images[activeInstance];

      instanceList = images.map((image, index) => {
        const metadata = image.getData().metadata;

        const { InstanceNumber } = metadata;

        return {
          value: index,
          title: `Instance Number: ${InstanceNumber}`,
          description: '',
          onClick: () => {
            setActiveInstance(index);
          },
        };
      });

      metadata = image.getData().metadata;
    } else {
      metadata = activeDisplaySet.metadata;
    }

    setTags(getSortedTags(metadata));
    setMeta(metadata);
    setInstanceList(instanceList);
    setDisplaySetList(newDisplaySetList);
    setIsImageStack(isImageStack);
  }, [activeDisplaySetInstanceUID, activeInstance]);

  const selectedDisplaySetValue = displaySetList.find(
    ds => ds.value === activeDisplaySetInstanceUID
  );

  let instanceSelectList = null;

  if (isImageStack) {
    instanceSelectList = (
      <div className="dicom-tag-browser-instance-range">
        <Range
          showValue
          step={1}
          min={1}
          max={instanceList.length - 1}
          value={activeInstance}
          valueRenderer={value => <p>Instance Number: {value}</p>}
          onChange={({ target }) => {
            const instanceIndex = parseInt(target.value);
            setActiveInstance(instanceIndex);
          }}
        />
      </div>
    );
  }

  return (
    <div className="dicom-tag-browser-content">
      <DicomBrowserSelect
        value={selectedDisplaySetValue}
        formatOptionLabel={DicomBrowserSelectItem}
        options={displaySetList}
      />
      {instanceSelectList}
      <div className="dicom-tag-browser-table-wrapper">
        <DicomTagTable tags={tags} meta={meta}></DicomTagTable>
      </div>
    </div>
  );
};

function DicomTagTable({ tags, meta }) {
  const rows = getFormattedRowsFromTags(tags, meta);

  return (
    <table className="dicom-tag-browser-table">
      <tbody>
        <tr>
          <th className="dicom-tag-browser-table-left">Tag</th>
          <th className="dicom-tag-browser-table-left">Value Representation</th>
          <th className="dicom-tag-browser-table-left">Keyword</th>
          <th className="dicom-tag-browser-table-left">Value</th>
        </tr>
        {rows.map((row, index) => {
          const className = row.className ? row.className : null;

          return (
            <tr className={className} key={`DICOMTagRow-${index}`}>
              <td>{row[0]}</td>
              <td className="dicom-tag-browser-table-center">{row[1]}</td>
              <td>{row[2]}</td>
              <td>{row[3]}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function getFormattedRowsFromTags(tags, meta) {
  const rows = [];

  tags.forEach(tagInfo => {
    if (tagInfo.vr === 'SQ') {
      rows.push([
        `${tagInfo.tagIndent}${tagInfo.tag}`,
        tagInfo.vr,
        tagInfo.keyword,
        '',
      ]);

      const { values } = tagInfo;

      values.forEach((item, index) => {
        const formatedRowsFromTags = getFormattedRowsFromTags(item);

        rows.push([
          `${item[0].tagIndent}(FFFE,E000)`,
          '',
          `Item #${index}`,
          '',
        ]);

        rows.push(...formatedRowsFromTags);
      });
    } else {
      if (tagInfo.vr === 'xs') {
        try {
          const dataset = metadataProvider.getStudyDataset(
            meta.StudyInstanceUID
          );
          const tag = dcmjs.data.Tag.fromPString(tagInfo.tag).toCleanString();
          const originalTagInfo = dataset[tag];
          tagInfo.vr = originalTagInfo.vr;
        } catch (error) {
          console.error(
            `Failed to parse value representation for tag '${tagInfo.keyword}'`
          );
        }
      }

      rows.push([
        `${tagInfo.tagIndent}${tagInfo.tag}`,
        tagInfo.vr,
        tagInfo.keyword,
        tagInfo.value,
      ]);
    }
  });

  return rows;
}

function getSortedTags(metadata) {
  const tagList = getRows(metadata);

  // Sort top level tags, sequence groups are sorted when created.
  _sortTagList(tagList);

  return tagList;
}

function getRows(metadata, depth = 0) {
  // Tag, Type, Value, Keyword

  const keywords = Object.keys(metadata);

  let tagIndent = '';

  for (let i = 0; i < depth; i++) {
    tagIndent += '>';
  }

  if (depth > 0) {
    tagIndent += ' '; // If indented, add a space after the indents.
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

      const sequence = {
        tag: tagInfo.tag,
        tagIndent,
        vr: tagInfo.vr,
        keyword,
        values: [],
      };

      rows.push(sequence);

      if (value === null) {
        // Type 2 Sequence
        continue;
      }

      sequenceAsArray.forEach(item => {
        const sequenceRows = getRows(item, depth + 1);

        if (sequenceRows.length) {
          // Sort the sequence group.
          _sortTagList(sequenceRows);
          sequence.values.push(sequenceRows);
        }
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
            console.warn(`Unrecognised Value: ${value} for ${keyword}:`);
            console.warn(value);
            value = ' ';
          }
        } else {
          console.warn(`Unrecognised Value: ${value} for ${keyword}:`);
          value = ' ';
        }
      }
    }

    // tag / vr/ keyword/ value

    // Remove retired tags
    keyword = keyword.replace('RETIRED_', '');

    if (tagInfo) {
      rows.push({
        tag: tagInfo.tag,
        tagIndent,
        vr: tagInfo.vr,
        keyword,
        value,
      });
    } else {
      // Private tag
      const tag = `(${keyword.substring(0, 4)},${keyword.substring(4, 8)})`;

      rows.push({
        tag,
        tagIndent,
        vr: '',
        keyword: 'Private Tag',
        value,
      });
    }
  }

  return rows;
}

function toArray(objectOrArray) {
  return Array.isArray(objectOrArray) ? objectOrArray : [objectOrArray];
}

function _sortTagList(tagList) {
  tagList.sort((a, b) => {
    if (a.tag < b.tag) {
      return -1;
    }

    return 1;
  });
}

export default DicomTagBrowser;
