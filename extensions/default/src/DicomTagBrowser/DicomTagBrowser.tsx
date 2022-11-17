import React, { useState, useEffect, useRef } from 'react';
import { classes } from '@ohif/core';
import Range from './Range';
import DicomTagTable from './DicomTagTable';
import dcmjs from 'dcmjs';
import moment from 'moment';
import './DicomTagBrowser.css';
import { Select, Typography } from '@ohif/ui';

const { ImageSet } = classes;
const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;


let instanceSelectList = null;
let instanceSelectTitle = null;

const DicomTagBrowser = ({ displaySets, displaySetInstanceUID }) => {
  const [
    activeDisplaySetInstanceUID,
    setActiveDisplaySetInstanceUID,
  ] = useState(displaySetInstanceUID);
  const [activeInstance, setActiveInstance] = useState(1);
  const [tags, setTags] = useState([]);
  const [meta, setMeta] = useState('');
  const [instanceList, setInstanceList] = useState([]);
  const [displaySetList, setDisplaySetList] = useState([]);
  const [isImageStack, setIsImageStack] = useState(false);
  const [selectedDisplaySetValue, setSelectedDisplaySetValue] = useState({}
  );
  const onSeriesSelect = value => {
    console.log(value);
    setActiveDisplaySetInstanceUID(value.value);
    setActiveInstance(1);
    setSelectedDisplaySetValue(value);
  };

  useEffect(() => {
    var activeDisplaySet = displaySets.find(
      ds => ds.displaySetInstanceUID === activeDisplaySetInstanceUID
    );

    displaySets.sort((a, b) => a.SeriesNumber - b.SeriesNumber);

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
        label: `${SeriesNumber} (${Modality}): ${SeriesDescription}`,
        description: displayDate,
        onClick: () => {
          setActiveDisplaySetInstanceUID(displaySetInstanceUID);
          setActiveInstance(1);

          //instanceSelectList.props.children.props.value = 1;
        },
      };
    });

    let metadata;
    if (!activeDisplaySet) {
      if (!displaySets || displaySets.length == 0) {
        return;
      } else {
        activeDisplaySet = displaySets[0];
        setActiveDisplaySetInstanceUID(displaySets[0].displaySetInstanceUID);
        setSelectedDisplaySetValue(newDisplaySetList[0]);
      }

    } else {

      setSelectedDisplaySetValue(newDisplaySetList.find(
        ds => ds.value === activeDisplaySetInstanceUID
      ));
    }
    const isImageStack =
      activeDisplaySet instanceof ImageSet; /*&&
      activeDisplaySet.isSOPClassUIDSupported === true*/;

    let instanceList;
    if (isImageStack) {
      const { images } = activeDisplaySet;
      const image = images[activeInstance - 1];
      instanceList = images.map((image, index) => {
        // const metadata = image.getData().metadata;

        const { InstanceNumber } = image;

        return {
          value: index,
          title: `Instance Number: ${InstanceNumber}`,
          description: '',
          onClick: () => {
            setActiveInstance(index);
          },
        };
      });
      metadata = image;
    } else {
      metadata = activeDisplaySet;
    }


    if (isImageStack) {
      instanceSelectTitle = (
        <Typography variant="subtitle" className="mr-5 text-right h-full">
          Instance Number
        </Typography>
      )
      instanceSelectList = (
        <div className="dicom-tag-browser-instance-range ml-auto">
          <Range
            showValue
            step={1}
            min={1}
            max={instanceList.length}
            value={activeInstance}
            valueRenderer={value => <p>{value}</p>}
            onChange={({ target }) => {
              const instanceIndex = parseInt(target.value);
              setActiveInstance(instanceIndex);
            }}
          />
        </div>
      );
    } else {
      instanceSelectList = null;
    }
    setTags(getSortedTags(metadata));
    setMeta(metadata);
    setInstanceList(instanceList);
    setDisplaySetList(newDisplaySetList);
    setIsImageStack(isImageStack);
  }, [activeDisplaySetInstanceUID, activeInstance, displaySets]);

  return (
    <div className="dicom-tag-browser-content">
      <div className="flex flex-row items-center justify-between">
        <Typography variant="subtitle" className="mr-5 text-right h-full">
          Series
        </Typography>
        {instanceSelectTitle}</div>
      <div className="flex flex-row items-center">

        <div className="w-72">
          <Select
            isClearable={false}
            onChange={onSeriesSelect}
            options={displaySetList}
            value={selectedDisplaySetValue}
          /></div>
        {instanceSelectList}
      </div>

      <div className="dicom-tag-browser-table-wrapper">
        <DicomTagTable rows={getFormattedRowsFromTags(tags, meta)}></DicomTagTable>
      </div>
    </div>
  );
};


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
          /*  const dataset = metadataProvider.getStudyDataset(
              meta.StudyInstanceUID
            );*/
          //  console.log(dataset);

          //  const tag = dcmjs.data.Tag.fromPString(tagInfo.tag).toCleanString();
          // const originalTagInfo = dataset[tag];
          //  tagInfo.vr = originalTagInfo.vr;
        } catch (error) {
          console.error(
            `Failed to parse value representation for tag '${tagInfo.keyword}'`
          );
        }
      }
      if (tagInfo.vr === 'PN') {
        rows.push([
          `${tagInfo.tagIndent}${tagInfo.tag}`,
          tagInfo.vr,
          tagInfo.keyword,
          tagInfo.value
        ]);
      } else {

        rows.push([
          `${tagInfo.tagIndent}${tagInfo.tag}`,
          tagInfo.vr,
          tagInfo.keyword,
          tagInfo.value,
        ]);
      }
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
      var regex = /[0-9A-Fa-f]{6}/g;
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
