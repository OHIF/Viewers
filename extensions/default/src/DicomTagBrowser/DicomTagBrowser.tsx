import dcmjs from 'dcmjs';
import moment from 'moment';
import React, { useState, useMemo, useCallback } from 'react';
import { classes, Types } from '@ohif/core';
import { InputFilter } from '@ohif/ui-next';
import { Select, SelectTrigger, SelectContent, SelectItem, Slider } from '@ohif/ui-next';

import DicomTagTable from './DicomTagTable';
import './DicomTagBrowser.css';

export type Row = {
  uid: string;
  tag: string;
  valueRepresentation: string;
  keyword: string;
  value: string;
  isVisible: boolean;
  depth: number;
  parents?: string[];
  children?: string[];
  areChildrenVisible?: boolean;
};

let rowCounter = 0;
const generateRowId = () => `row_${++rowCounter}`;

const { ImageSet } = classes;
const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;

const DicomTagBrowser = ({
  displaySets,
  displaySetInstanceUID,
}: {
  displaySets: Types.DisplaySet[];
  displaySetInstanceUID: string;
}) => {
  const [selectedDisplaySetInstanceUID, setSelectedDisplaySetInstanceUID] =
    useState(displaySetInstanceUID);
  const [instanceNumber, setInstanceNumber] = useState(1);
  const [shouldShowInstanceList, setShouldShowInstanceList] = useState(false);
  const [filterValue, setFilterValue] = useState('');

  const onSelectChange = value => {
    setSelectedDisplaySetInstanceUID(value.value);
    setInstanceNumber(1);
  };

  const activeDisplaySet = displaySets.find(
    ds => ds.displaySetInstanceUID === selectedDisplaySetInstanceUID
  );

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
        label: `${SeriesNumber} (${Modality}):  ${SeriesDescription}`,
        description: displayDate,
      };
    });
  }, [displaySets]);

  const getMetadata = useCallback(
    isImageStack => {
      if (isImageStack) {
        return activeDisplaySet.images[instanceNumber - 1];
      }
      return activeDisplaySet.instance || activeDisplaySet;
    },
    [activeDisplaySet, instanceNumber]
  );

  const rows = useMemo(() => {
    const isImageStack = activeDisplaySet instanceof ImageSet;
    const metadata = getMetadata(isImageStack);

    setShouldShowInstanceList(isImageStack && activeDisplaySet.images.length > 1);
    const tags = getSortedTags(metadata);
    const rows = getFormattedRowsFromTags({ tags, metadata });
    return rows;
  }, [getMetadata, activeDisplaySet]);

  const filteredRows = useMemo(() => {
    if (!filterValue) {
      return rows;
    }

    const matchedRowIds = new Set();

    const propertiesToCheck = ['tag', 'valueRepresentation', 'keyword', 'value'];

    const setIsMatched = row => {
      const isDirectMatch = propertiesToCheck.some(propertyName =>
        row[propertyName]?.toLowerCase().includes(filterValueLowerCase)
      );

      if (!isDirectMatch) {
        return;
      }

      matchedRowIds.add(row.uid);

      [...(row.parents ?? []), ...(row.children ?? [])].forEach(uid => matchedRowIds.add(uid));
    };

    const filterValueLowerCase = filterValue.toLowerCase();
    rows.forEach(setIsMatched);
    return rows.filter(row => matchedRowIds.has(row.uid));
  }, [rows, filterValue]);

  return (
    <div className="dicom-tag-browser-content bg-muted">
      <div className="mb-6 flex flex-row items-start pl-1">
        <div className="flex w-full flex-row items-start gap-4">
          <div className="flex w-1/3 flex-col">
            <span className="text-muted-foreground flex h-6 items-center pb-2 text-base">
              Series
            </span>
            <Select
              value={selectedDisplaySetInstanceUID}
              onValueChange={value => onSelectChange({ value })}
            >
              <SelectTrigger>
                {displaySetList.find(ds => ds.value === selectedDisplaySetInstanceUID)?.label ||
                  'Select Series'}
              </SelectTrigger>
              <SelectContent>
                {displaySetList.map(item => {
                  return (
                    <SelectItem
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                      <span className="text-muted-foreground ml-1 text-xs">{item.description}</span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {shouldShowInstanceList && (
            <div className="mx-auto mt-0.5 flex w-1/4 flex-col">
              <span className="text-muted-foreground flex h-6 items-center pb-2 text-base">
                Instance Number ({instanceNumber} of {activeDisplaySet?.images?.length})
              </span>
              <Slider
                value={[instanceNumber]}
                onValueChange={([value]) => {
                  setInstanceNumber(value);
                }}
                min={1}
                max={activeDisplaySet?.images?.length}
                step={1}
                className="pt-4"
              />
            </div>
          )}
          <div className="ml-auto mr-1 flex w-1/3 flex-col">
            <span className="text-muted-foreground flex h-6 items-center pb-2 text-base">
              Search metadata
            </span>
            <InputFilter
              className="text-muted-foreground"
              onChange={setFilterValue}
            >
              <InputFilter.SearchIcon />
              <InputFilter.Input
                placeholder="Search metadata"
                className="pl-9 pr-9"
              />
              <InputFilter.ClearButton className="text-primary mr-0.5 p-0.5" />
            </InputFilter>
          </div>
        </div>
      </div>
      <DicomTagTable rows={filteredRows} />
    </div>
  );
};

function getFormattedRowsFromTags({ tags, metadata }) {
  const rows: Row[] = [];
  const stack = [{ tags, depth: 0, parents: null, index: 0, children: [] }];
  const parentChildMap = new Map();

  while (stack.length > 0) {
    const current = stack.pop();
    const { tags, depth, parents, index, children } = current;

    for (let i = index; i < tags.length; i++) {
      const tagInfo = tags[i];
      const uid = tagInfo.uid ?? generateRowId();

      if (parents?.length > 0) {
        parents.forEach(parent => {
          parentChildMap.get(parent).push(uid);
        });
      }

      if (tagInfo.vr === 'SQ') {
        const row: Row = {
          uid,
          tag: tagInfo.tag,
          valueRepresentation: tagInfo.vr,
          keyword: tagInfo.keyword,
          value: '',
          depth,
          isVisible: true,
          areChildrenVisible: true,
          children: [],
          parents,
        };
        rows.push(row);
        parentChildMap.set(uid, row.children);

        const newParents = parents ? [...parents, uid] : [uid];

        if (tagInfo.values.length > 0) {
          stack.push({ tags, depth, parents, index: i + 1, children });
          for (
            let j = tagInfo.values.length - 1, values = tagInfo.values[j];
            j >= 0;
            values = tagInfo.values[--j]
          ) {
            const itemUid = generateRowId();
            stack.push({
              tags: values,
              depth: depth + 2,
              parents: [...newParents, itemUid],
              index: 0,
              children: [],
            });
            const itemTagInfo = {
              tags: [
                {
                  tag: '(FFFE,E000)',
                  vr: '',
                  keyword: `Item #${j}`,
                  value: '',
                  uid: itemUid,
                },
              ],
              depth: depth + 1,
              parents: newParents,
              index: 0,
              children: [],
            };
            stack.push(itemTagInfo);
            parentChildMap.set(itemUid, itemTagInfo.children);
          }
          break;
        }
      } else {
        if (tagInfo.vr === 'xs') {
          try {
            const tag = dcmjs.data.Tag.fromPString(tagInfo.tag).toCleanString();
            const originalTagInfo = metadata[tag];
            tagInfo.vr = originalTagInfo.vr;
          } catch (error) {
            console.warn(`Failed to parse value representation for tag '${tagInfo.keyword}'`);
          }
        }
        const row: Row = {
          uid,
          tag: tagInfo.tag,
          valueRepresentation: tagInfo.vr,
          keyword: tagInfo.keyword,
          value: tagInfo.value,
          depth,
          isVisible: true,
          parents,
        };
        rows.push(row);
        if (row.tag === '(FFFE,E000)') {
          row.areChildrenVisible = true;
          row.children = [];
        }
      }
    }
  }
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
          vr: '',
          keyword: 'Private Tag',
          value,
        });
      }
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
