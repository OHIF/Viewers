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
            <span className="text-muted-foreground flex h-6 items-center text-xs">Series</span>
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
              <span className="text-muted-foreground flex h-6 items-center text-xs">
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
            <span className="text-muted-foreground flex h-6 items-center text-xs">
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
              <InputFilter.ClearButton />
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

// Add robust tag lookup function before getRows
function getTagInfoFromKeyword(keyword) {
  // First try direct lookup in nameMap
  let tagInfo = nameMap[keyword];
  if (tagInfo) {
    return tagInfo;
  }

  // Handle hex tag format (e.g., "00280030")
  if (/^[0-9A-Fa-f]{8}$/.test(keyword)) {
    try {
      const tagString = `(${keyword.substring(0, 4)},${keyword.substring(4, 8)})`;
      
      // Create a simple lookup map for common tags since dcmjs API is unreliable
      const commonTags = {
        '00280002': { tag: '(0028,0002)', vr: 'US', keyword: 'SamplesPerPixel' },
        '00280004': { tag: '(0028,0004)', vr: 'CS', keyword: 'PhotometricInterpretation' },
        '00280008': { tag: '(0028,0008)', vr: 'IS', keyword: 'NumberOfFrames' },
        '00280010': { tag: '(0028,0010)', vr: 'US', keyword: 'Rows' },
        '00280011': { tag: '(0028,0011)', vr: 'US', keyword: 'Columns' },
        '00280030': { tag: '(0028,0030)', vr: 'DS', keyword: 'PixelSpacing' },
        '00280100': { tag: '(0028,0100)', vr: 'US', keyword: 'BitsAllocated' },
        '00280101': { tag: '(0028,0101)', vr: 'US', keyword: 'BitsStored' },
        '00280102': { tag: '(0028,0102)', vr: 'US', keyword: 'HighBit' },
        '00280103': { tag: '(0028,0103)', vr: 'US', keyword: 'PixelRepresentation' },
        '00281050': { tag: '(0028,1050)', vr: 'DS', keyword: 'WindowCenter' },
        '00281051': { tag: '(0028,1051)', vr: 'DS', keyword: 'WindowWidth' },
        '00281052': { tag: '(0028,1052)', vr: 'DS', keyword: 'RescaleIntercept' },
        '00281053': { tag: '(0028,1053)', vr: 'DS', keyword: 'RescaleSlope' },
        '00281054': { tag: '(0028,1054)', vr: 'LO', keyword: 'RescaleType' },
        '00200052': { tag: '(0020,0052)', vr: 'UI', keyword: 'FrameOfReferenceUID' },
        '00080018': { tag: '(0008,0018)', vr: 'UI', keyword: 'SOPInstanceUID' },
        '00080016': { tag: '(0008,0016)', vr: 'UI', keyword: 'SOPClassUID' },
        '0020000D': { tag: '(0020,000D)', vr: 'UI', keyword: 'StudyInstanceUID' },
        '0020000E': { tag: '(0020,000E)', vr: 'UI', keyword: 'SeriesInstanceUID' },
        '00200013': { tag: '(0020,0013)', vr: 'IS', keyword: 'InstanceNumber' },
        '00080008': { tag: '(0008,0008)', vr: 'CS', keyword: 'ImageType' },
        '00080060': { tag: '(0008,0060)', vr: 'CS', keyword: 'Modality' },
        '00100010': { tag: '(0010,0010)', vr: 'PN', keyword: 'PatientName' },
        '00100020': { tag: '(0010,0020)', vr: 'LO', keyword: 'PatientID' },
      };
      
      // Try direct lookup in our common tags map
      if (commonTags[keyword]) {
        return commonTags[keyword];
      }
      
      // Try multiple dcmjs API approaches as fallback
      let tagKeyword = null;
      try {
        const tag = dcmjs.data.Tag.fromString(tagString);
        // Try different API patterns
        if (dcmjs.data.DicomMetaDictionary.keyword && dcmjs.data.DicomMetaDictionary.keyword.fromTag) {
          tagKeyword = dcmjs.data.DicomMetaDictionary.keyword.fromTag(tag);
        } else if (dcmjs.data.DicomMetaDictionary.keywordOf) {
          tagKeyword = dcmjs.data.DicomMetaDictionary.keywordOf(tag);
        } else {
          // Fallback: search through nameMap for matching tag
          for (const [key, info] of Object.entries(nameMap)) {
            if ((info as any)?.tag === tagString) {
              tagKeyword = key;
              break;
            }
          }
        }
      } catch (tagError) {
        // Fallback: search through nameMap for matching tag
        for (const [key, info] of Object.entries(nameMap)) {
          if ((info as any)?.tag === tagString) {
            tagKeyword = key;
            break;
          }
        }
      }
      
      if (tagKeyword && nameMap[tagKeyword]) {
        return nameMap[tagKeyword];
      }
    } catch (error) {
      console.warn(`Failed to parse hex tag ${keyword}:`, error);
    }
  }

  // Handle "x" prefixed hex format (e.g., "x00280030")
  if (/^x[0-9A-Fa-f]{8}$/.test(keyword)) {
    // Remove the 'x' prefix and try again
    const hexKeyword = keyword.substring(1);
    return getTagInfoFromKeyword(hexKeyword);
  }

  return null;
}

function getRows(metadata, depth = 0) {
  // Tag, Type, Value, Keyword

  const keywords = Object.keys(metadata);

  // Convert XNAT metadata format to standard DICOM tag format for proper display

  const rows = [];
  const processedTags = new Set(); // Track processed tags to avoid duplicates
  
  for (let i = 0; i < keywords.length; i++) {
    let keyword = keywords[i];

    if (keyword === '_vrMap') {
      continue;
    }

    // Use robust tag lookup instead of direct nameMap access
    const tagInfo = getTagInfoFromKeyword(keyword);

    let value = metadata[keyword];

    // Handle XNAT's DICOM object format: {vr: 'UI', Value: ['value']}
    if (value && typeof value === 'object' && value.Value && Array.isArray(value.Value)) {
      // Extract the actual value from the DICOM object
      if (value.Value.length === 1) {
        value = value.Value[0];
      } else if (value.Value.length > 1) {
        value = value.Value.join('\\'); // Multi-value separator
      } else {
        value = '';
      }
    }

    // Skip if we've already processed this tag (avoid duplicates)
    const tagKey = tagInfo?.tag || `(${keyword.substring(0, 4)},${keyword.substring(4, 8)})`;
    if (processedTags.has(tagKey)) {
      continue;
    }
    processedTags.add(tagKey);

    if (tagInfo && tagInfo.vr === 'SQ') {
      const sequenceAsArray = toArray(value);

      // Push line defining the sequence

      const sequence = {
        tag: tagInfo.tag,
        vr: tagInfo.vr,
        keyword: tagInfo.keyword,
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

    if (tagInfo) {
      // Remove retired tags prefix and use the proper keyword
      const cleanKeyword = (tagInfo.keyword || keyword).replace('RETIRED_', '');
      rows.push({
        tag: tagInfo.tag,
        vr: tagInfo.vr,
        keyword: cleanKeyword,
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
