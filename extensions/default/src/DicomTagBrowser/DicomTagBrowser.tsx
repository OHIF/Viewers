import dcmjs from 'dcmjs';
import moment from 'moment';
import React, { useState, useMemo, useEffect } from 'react';
import { classes } from '@ohif/core';
import { InputRange, Select, Typography, InputFilterText } from '@ohif/ui';
import debounce from 'lodash.debounce';

import DicomTagTable from './DicomTagTable';
import './DicomTagBrowser.css';

const { ImageSet } = classes;
const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;

const DicomTagBrowser = ({ displaySets, displaySetInstanceUID }) => {
  // The column indices that are to be excluded during a filter of the table.
  // At present the column indices are:
  // 0: DICOM tag
  // 1: VR
  // 2: Keyword
  // 3: Value
  const excludedColumnIndicesForFilter: Set<number> = new Set([1]);

  const [selectedDisplaySetInstanceUID, setSelectedDisplaySetInstanceUID] =
    useState(displaySetInstanceUID);
  const [instanceNumber, setInstanceNumber] = useState(1);
  const [filterValue, setFilterValue] = useState('');

  const onSelectChange = value => {
    setSelectedDisplaySetInstanceUID(value.value);
    setInstanceNumber(1);
  };

  const activeDisplaySet = displaySets.find(
    ds => ds.displaySetInstanceUID === selectedDisplaySetInstanceUID
  );

  const isImageStack = _isImageStack(activeDisplaySet);
  const showInstanceList = isImageStack && activeDisplaySet.images.length > 1;

  const displaySetList = useMemo(() => {
    displaySets.sort((a, b) => a.SeriesNumber - b.SeriesNumber);
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
        label: `${SeriesNumber} (${Modality}): ${SeriesDescription}`,
        description: displayDate,
      };
    });
  }, [displaySets]);

  const rows = useMemo(() => {
    let metadata;
    if (isImageStack) {
      metadata = activeDisplaySet.images[instanceNumber - 1];
    } else {
      metadata = activeDisplaySet.instance || activeDisplaySet;
    }
    const tags = getSortedTags(metadata);
    return getFormattedRowsFromTags(tags, metadata);
  }, [instanceNumber, selectedDisplaySetInstanceUID]);

  const filteredRows = useMemo(() => {
    if (!filterValue) {
      return rows;
    }

    const filterValueLowerCase = filterValue.toLowerCase();
    return rows.filter(row => {
      return row.reduce((keepRow, col, colIndex) => {
        if (keepRow) {
          // We are already keeping the row, why do more work so return now.
          return keepRow;
        }

        if (excludedColumnIndicesForFilter.has(colIndex)) {
          return keepRow;
        }

        return keepRow || col.toLowerCase().includes(filterValueLowerCase);
      }, false);
    });
  }, [rows, filterValue]);

  const debouncedSetFilterValue = useMemo(() => {
    return debounce(setFilterValue, 200);
  }, []);

  useEffect(() => {
    return () => {
      debouncedSetFilterValue?.cancel();
    };
  }, []);

  return (
    <div className="dicom-tag-browser-content">
      <div className="mb-6 flex flex-row items-center pl-1">
        <div className="flex w-1/2 flex-row items-center">
          <Typography
            variant="subtitle"
            className="mr-4"
          >
            Series
          </Typography>
          <div className="mr-8 grow">
            <Select
              id="display-set-selector"
              isClearable={false}
              onChange={onSelectChange}
              options={displaySetList}
              value={displaySetList.find(ds => ds.value === selectedDisplaySetInstanceUID)}
              className="text-white"
            />
          </div>
        </div>
        <div className="flex w-1/2 flex-row items-center">
          {showInstanceList && (
            <Typography
              variant="subtitle"
              className="mr-4"
            >
              Instance Number
            </Typography>
          )}
          {showInstanceList && (
            <div className="grow">
              <InputRange
                value={instanceNumber}
                key={selectedDisplaySetInstanceUID}
                onChange={value => {
                  setInstanceNumber(parseInt(value));
                }}
                minValue={1}
                maxValue={activeDisplaySet.images.length}
                step={1}
                inputClassName="w-full"
                labelPosition="left"
                trackColor={'#3a3f99'}
              />
            </div>
          )}
        </div>
      </div>
      <div className="h-1 w-full bg-black"></div>
      <div className="my-3 flex w-1/2 flex-row">
        <InputFilterText
          className="mr-8 block w-full"
          placeholder="Search metadata..."
          onDebounceChange={setFilterValue}
        ></InputFilterText>
      </div>
      <DicomTagTable rows={filteredRows} />
    </div>
  );
};

function getFormattedRowsFromTags(tags, metadata) {
  const rows = [];

  tags.forEach(tagInfo => {
    if (tagInfo.vr === 'SQ') {
      rows.push([`${tagInfo.tagIndent}${tagInfo.tag}`, tagInfo.vr, tagInfo.keyword, '']);

      const { values } = tagInfo;

      values.forEach((item, index) => {
        const formatedRowsFromTags = getFormattedRowsFromTags(item, metadata);

        rows.push([`${item[0].tagIndent}(FFFE,E000)`, '', `Item #${index}`, '']);

        rows.push(...formatedRowsFromTags);
      });
    } else {
      if (tagInfo.vr === 'xs') {
        try {
          const tag = dcmjs.data.Tag.fromPString(tagInfo.tag).toCleanString();
          const originalTagInfo = metadata[tag];
          tagInfo.vr = originalTagInfo.vr;
        } catch (error) {
          console.error(`Failed to parse value representation for tag '${tagInfo.keyword}'`);
        }
      }
      rows.push([`${tagInfo.tagIndent}${tagInfo.tag}`, tagInfo.vr, tagInfo.keyword, tagInfo.value]);
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
      if (value.length > 0 && typeof value[0] != 'object') {
        value = value.join('\\');
      }
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
      // skip properties without hex tag numbers
      const regex = /[0-9A-Fa-f]{6}/g;
      if (keyword.match(regex)) {
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
  }

  return rows;
}

function _isImageStack(displaySet) {
  return displaySet instanceof ImageSet;
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
