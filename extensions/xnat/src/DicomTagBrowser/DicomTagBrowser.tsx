import React, { useState, useEffect } from 'react';
import { classes, OHIF } from '@ohif/core';
import dcmjs from 'dcmjs';
import moment from 'moment';
import { Slider } from '@ohif/ui-next';
import DicomBrowserSelect from './DicomBrowserSelect';
import './DicomTagBrowser.css';
import DicomBrowserSelectItem from './DicomBrowserSelectItem';
import _ from 'lodash';
import axios from 'axios';

const { ImageSet } = classes;
const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;

const metadataProvider = OHIF.classes.MetadataProvider;

// Define types for our components
type ImageType = any; // Using any due to the complex structure and diverse properties
type MetadataType = {
  [key: string]: any;
}; // Using an indexed type for metadata

const DicomTagBrowser = ({ displaySets, displaySetInstanceUID }) => {
  const [
    activeDisplaySetInstanceUID,
    setActiveDisplaySetInstanceUID,
  ] = useState(displaySetInstanceUID);
  const [activeInstance, setActiveInstance] = useState(0);
  const [tags, setTags] = useState([]);
  const [meta, setMeta] = useState<MetadataType>({});
  const [numInstances, setNumInstances] = useState(0);
  const [displaySetList, setDisplaySetList] = useState([]);

  useEffect(() => {
    // Make sure displaySets is not empty
    if (!displaySets || !displaySets.length) {
      return;
    }

    // Include all display sets instead of filtering
    const newDisplaySetList = displaySets.map(displaySet => {
      const {
        displaySetInstanceUID,
        SeriesDate = '',
        SeriesTime = '',
        SeriesNumber = '',
        SeriesDescription = 'Unknown Series',
        Modality = '',
      } = displaySet;

      /* Map to display representation */
      let displayDate = '';
      try {
        if (SeriesDate) {
          const date = moment(SeriesDate, 'YYYYMMDD');
          displayDate = date.format('ddd, MMM Do YYYY');
        }
      } catch (error) {
        console.warn('Error formatting date:', error);
      }

      return {
        value: displaySetInstanceUID,
        title: `${SeriesNumber} (${Modality}): ${SeriesDescription}`,
        description: displayDate,
      };
    });

    setDisplaySetList(newDisplaySetList);
    
    // If no active display set is selected, set the first one
    if ((!activeDisplaySetInstanceUID || !displaySets.find(ds => ds.displaySetInstanceUID === activeDisplaySetInstanceUID)) 
        && newDisplaySetList.length > 0) {
      setActiveDisplaySetInstanceUID(newDisplaySetList[0].value);
    } else if (displaySetInstanceUID && displaySetInstanceUID !== activeDisplaySetInstanceUID) {
      // If a displaySetInstanceUID was provided and it's different from current active, update it
      setActiveDisplaySetInstanceUID(displaySetInstanceUID);
    }
  }, [displaySets, activeDisplaySetInstanceUID, displaySetInstanceUID]);

  useEffect(() => {
    const activeDisplaySet = displaySets.find(
      ds => ds.displaySetInstanceUID === activeDisplaySetInstanceUID
    );

    if (!activeDisplaySet) return;

    let metadata: MetadataType;
    const isImageStack = activeDisplaySet instanceof ImageSet;

    let numInstances = 1;

    if (isImageStack) {
      const { images } = activeDisplaySet;
      if (!images || !images.length || activeInstance >= images.length) {
        return;
      }
      
      const image: ImageType = images[activeInstance];
      numInstances = images.length;
      
      // In OHIFv3, we need to look in several places for the complete metadata
      metadata = {
        ...image
      };
      
      // Look for metadata in different possible locations
      if (image.data && typeof image.data === 'object') {
        metadata = { ...metadata, ...image.data };
      }
      
      if (image.metadata && typeof image.metadata === 'object') {
        metadata = { ...metadata, ...image.metadata };
      }
      
      // Try to get additional metadata from the metadataProvider
      const imageId = image.imageId || 
                     (image._imageId) || 
                     (image._instance && image._instance.url);
      
      if (imageId) {
        const metadata2 = metadataProvider.get('instance', imageId);
        if (!_.isEmpty(metadata2)) {
          metadata = { ...metadata, ...metadata2 };
          
          // Check for file meta information
          if (metadata2._meta) {
            metadata._meta = metadata2._meta;
          }
        }

        // In OHIFv3, also try 'imagePlaneModule' for additional metadata
        const imagePlaneModule = metadataProvider.get('imagePlaneModule', imageId);
        if (imagePlaneModule) {
          metadata = { ...metadata, ...imagePlaneModule };
        }
        
        // Try to load the full DICOM dataset directly from the server
        if (imageId.startsWith('dicomweb:')) {
          const dicomUrl = imageId.substring(9); // Remove 'dicomweb:' prefix
          fetchFullDicomMetadata(dicomUrl)
            .then(fullMetadata => {
              if (fullMetadata) {
                const combinedMetadata = { ...metadata, ...fullMetadata };
                setTags(getSortedTags(combinedMetadata));
                setMeta(combinedMetadata);
              }
            })
            .catch(error => {
              console.error('Error fetching full DICOM metadata:', error);
            });
        }
      }
      
      // Try to access metadata from _instance if available
      if (image._instance) {
        metadata = { ...metadata, ...image._instance };
      }
      
      // Additional properties that might be directly on the image
      const directProps = ['SOPClassUID', 'SOPInstanceUID', 'StudyInstanceUID', 'SeriesInstanceUID', 
                          'ImageType', 'InstanceNumber', 'Modality', 'PixelSpacing', 'Rows', 'Columns'];
      
      directProps.forEach(prop => {
        if (image[prop] !== undefined && metadata[prop] === undefined) {
          metadata[prop] = image[prop];
        }
      });
      
      // Debug: Inspect object structure to understand where DICOM tags are hiding
      inspectMetadataStructure(image);
      
    } else {
      // For non-image displaySets, try different properties where metadata might be stored
      metadata = activeDisplaySet.metadata || activeDisplaySet;
      
      if (activeDisplaySet.instance) {
        metadata = { ...metadata, ...activeDisplaySet.instance };
      }
      
      if (activeDisplaySet.data) {
        metadata = { ...metadata, ...activeDisplaySet.data };
      }
    }

    setTags(getSortedTags(metadata));
    setMeta(metadata);
    setNumInstances(numInstances);
  }, [activeDisplaySetInstanceUID, activeInstance, displaySets]);

  const selectedDisplaySetValue = displaySetList.find(
    ds => ds.value === activeDisplaySetInstanceUID
  );

  let instanceSelectList = null;

  if (numInstances > 1) {
    const instanceNumber = meta.InstanceNumber || 1;
    const sopInstanceUID = meta.SOPInstanceUID || '';
    
    const rangeRenderValue = instanceNumber
      ? `Instance Number: ${instanceNumber}`
      : `SOP Instance UID: ${sopInstanceUID}`;
      
    instanceSelectList = (
      <div className="dicom-tag-browser-instance-range">
        <Slider
          value={[activeInstance + 1]}
          onValueChange={([value]) => {
            setActiveInstance(value - 1);
          }}
          min={1}
          max={numInstances}
          step={1}
          className="pt-4"
        />
        <div>
          <p>{rangeRenderValue}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="dicom-tag-browser-content">
      <DicomBrowserSelect
        value={selectedDisplaySetValue}
        formatOptionLabel={DicomBrowserSelectItem}
        options={displaySetList}
        onChange={ds => {
          if (ds && ds.value && ds.value !== activeDisplaySetInstanceUID) {
            setActiveDisplaySetInstanceUID(ds.value);
            setActiveInstance(0);
          }
        }}
      />
      {instanceSelectList}
      <div className="dicom-tag-browser-table-wrapper">
        <DicomTagTable tags={tags} meta={meta} />
      </div>
    </div>
  );
};

function DicomTagTable({ tags, meta }) {
  const rows = getFormattedRowsFromTags(tags, meta);

  // Function to format array values for display
  const formatValue = (value) => {
    if (typeof value !== 'string') return value;
    
    // If it's an array-like string with brackets, format it nicely
    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.join(', ');
        }
      } catch (e) {
        // Not valid JSON, just return as is
      }
    }
    return value;
  };

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
              <td>{formatValue(row[3])}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function getFormattedRowsFromTags(tags, meta = {}) {
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

      if (values && values.length) {
        values.forEach((item, index) => {
          // Make sure we have a valid item to process
          if (!item || !Array.isArray(item) || !item.length) {
            return;
          }
          
          rows.push([
            `${item[0].tagIndent}(FFFE,E000)`,
            '',
            `Item #${index}`,
            '',
          ]);

          const formatedRowsFromTags = getFormattedRowsFromTags(item, meta);
          rows.push(...formatedRowsFromTags);
        });
      }
    } else {
      if (tagInfo.vr === 'xs') {
        // Handle xs VR cases (SmallestImagePixelValue, LargestImagePixelValue)
        try {
          // Try to get tag information from dcmjs dictionary
          const tagNumber = tagInfo.tag.replace(/[()]/g, '').replace(',', '');
          
          // Convert to a standard VR based on the tag
          let standardVR = 'US'; // Default to Unsigned Short
          
          // SmallestImagePixelValue and LargestImagePixelValue VR depends on PixelRepresentation
          if (tagInfo.keyword === 'SmallestImagePixelValue' || tagInfo.keyword === 'LargestImagePixelValue') {
            // Use safer TypeScript type access
            const pixelRepresentation = (meta as any).PixelRepresentation !== undefined ? 
                                        (meta as any).PixelRepresentation : 0;
            standardVR = pixelRepresentation === 1 ? 'SS' : 'US';
          }
          
          rows.push([
            `${tagInfo.tagIndent}${tagInfo.tag}`,
            standardVR,
            tagInfo.keyword,
            tagInfo.value,
          ]);
        } catch (error) {
          console.warn(`Failed to parse value representation for tag '${tagInfo.keyword}'. Using default VR.`);
          rows.push([
            `${tagInfo.tagIndent}${tagInfo.tag}`,
            'UN', // Unknown VR
            tagInfo.keyword,
            tagInfo.value,
          ]);
        }
        return;
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
  // Look for DICOM elements metadata format from different versions
  if (metadata.elements) {
    return getSortedTagsFromElements(metadata.elements);
  }
  
  // Try to find elements in different locations
  for (const key of ['dataset', 'data']) {
    if (metadata[key] && metadata[key].elements) {
      return getSortedTagsFromElements(metadata[key].elements);
    }
  }
  
  // Standard processing otherwise
  let tagList = getRows(metadata);

  // DICOM File Meta Information
  let fmiTags = [];
  if (metadata._meta) {
    fmiTags = getRows(metadata._meta);
  }

  tagList = [...fmiTags, ...tagList];

  // Sort top level tags, sequence groups are sorted when created.
  _sortTagList(tagList);

  return tagList;
}

// Handle DICOM elements format (often used in cornerstoneJS)
function getSortedTagsFromElements(elements) {
  const tags = [];
  
  for (const tag in elements) {
    if (Object.prototype.hasOwnProperty.call(elements, tag)) {
      const element = elements[tag];
      const keyword = element.keyword || tag;
      const vr = element.vr || '';
      
      // Format tag properly
      let formattedTag = tag;
      if (tag.length === 8) {
        formattedTag = `(${tag.substring(0, 4)},${tag.substring(4, 8)})`;
      }
      
      // Handle sequences
      if (vr === 'SQ' && element.Value && Array.isArray(element.Value)) {
        const sequence = {
          tag: formattedTag,
          tagIndent: '',
          vr,
          keyword,
          values: [],
        };
        
        // Process each sequence item
        element.Value.forEach((sequenceItem, index) => {
          if (sequenceItem && typeof sequenceItem === 'object') {
            const itemTags = [];
            
            // Process each tag in the sequence item
            for (const itemTag in sequenceItem) {
              if (Object.prototype.hasOwnProperty.call(sequenceItem, itemTag)) {
                const itemElement = sequenceItem[itemTag];
                const itemKeyword = itemElement.keyword || itemTag;
                const itemVr = itemElement.vr || '';
                
                // Format tag
                let itemFormattedTag = itemTag;
                if (itemTag.length === 8) {
                  itemFormattedTag = `(${itemTag.substring(0, 4)},${itemTag.substring(4, 8)})`;
                }
                
                // Format value
                let itemValue = '';
                if (itemElement.Value !== undefined) {
                  if (Array.isArray(itemElement.Value)) {
                    itemValue = itemElement.Value.join('\\');
                  } else {
                    itemValue = itemElement.Value.toString();
                  }
                }
                
                itemTags.push({
                  tag: itemFormattedTag,
                  tagIndent: '> ',
                  vr: itemVr,
                  keyword: itemKeyword,
                  value: itemValue,
                });
              }
            }
            
            // Sort the tags within the sequence item
            if (itemTags.length) {
              _sortTagList(itemTags);
              sequence.values.push(itemTags);
            }
          }
        });
        
        tags.push(sequence);
      } else {
        // Handle regular elements
        let value = '';
        if (element.Value !== undefined) {
          if (Array.isArray(element.Value)) {
            value = element.Value.join('\\');
          } else {
            value = element.Value.toString();
          }
        }
        
        tags.push({
          tag: formattedTag,
          tagIndent: '',
          vr,
          keyword,
          value,
        });
      }
    }
  }
  
  _sortTagList(tags);
  return tags;
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

    // Skip internal properties and empty keys
    if (keyword === '_vrMap' || keyword === '_meta' || !keyword) {
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

    // Private sequence
    if (
      !tagInfo &&
      Array.isArray(value) &&
      value[0] &&
      typeof value[0] === 'object'
    ) {
      value = ' ';
    }

    if (Array.isArray(value) && value[0] && value[0] instanceof ArrayBuffer) {
      value = ' ';
    }

    if (Array.isArray(value)) {
      value = value.join('\\');
    }

    if (typeof value === 'number') {
      value = value.toString();
    }

    if (typeof value === 'boolean') {
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
          } else if (value instanceof ArrayBuffer) {
            value = ' ';
          } else if (ArrayBuffer.isView(value)) {
            value = ' ';
          } else if (value.Value !== undefined) {
            // Special case for DICOM JSON format
            if (Array.isArray(value.Value)) {
              value = value.Value.join('\\');
            } else {
              value = value.Value.toString();
            }
          } else if (value._rawValue !== undefined) {
            // Handle values with _rawValue property
            if (Array.isArray(value._rawValue)) {
              value = value._rawValue.join('\\');
            } else {
              value = value._rawValue.toString();
            }
          } else {
            try {
              // Try to stringify the object for display
              value = JSON.stringify(value).substring(0, 100);
              if (value.length === 100) {
                value += '...';
              }
            } catch (e) {
              console.warn(`Unrecognised Value: ${value} for ${keyword}:`);
              console.warn(value);
              value = ' ';
            }
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
      // Handle known non-standard tags that shouldn't be treated as private
      const knownTags = [
        'isReconstructable', 
        'metadata',
        'imageId',
        'url'
      ];
      
      if (knownTags.includes(keyword)) {
        rows.push({
          tag: '',
          tagIndent,
          vr: typeof value === 'boolean' ? 'BL' : typeof value === 'object' ? 'SQ' : '',
          keyword,
          value: typeof value === 'boolean' ? value.toString() : 
                 typeof value === 'object' ? JSON.stringify(value).substring(0, 64) + '...' : 
                 value || '',
        });
      } else if (keyword.length === 8) {
        // Private tag with standard format
        const tag = `(${keyword.substring(0, 4)},${keyword.substring(4, 8)})`;
  
        rows.push({
          tag,
          tagIndent,
          vr: '',
          keyword: 'Private Tag',
          value,
        });
      } else {
        // Other non-standard tag
        rows.push({
          tag: '',
          tagIndent,
          vr: '',
          keyword,
          value: value?.toString() || '',
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

// Inspect the object structure to find where DICOM tags might be hiding
function inspectMetadataStructure(obj, path = '', level = 0, maxLevel = 3) {
  // Don't go too deep to avoid infinite recursion
  if (level > maxLevel || !obj) return;
  
  // Only log main level to avoid console clutter
  if (level === 0) {
    console.log('Inspecting metadata structure for DicomTagBrowser...');
  }

  // Log direct DICOM properties
  const dicomProps = ['SOPClassUID', 'SOPInstanceUID', 'InstanceNumber', 'SeriesInstanceUID', 'StudyInstanceUID'];
  dicomProps.forEach(prop => {
    if (obj[prop] !== undefined) {
      console.log(`Found DICOM property at ${path}.${prop}: ${obj[prop]}`);
    }
  });
  
  // Check if the object has elements (common DICOM format)
  if (obj.elements && typeof obj.elements === 'object') {
    console.log(`Found elements at ${path}.elements with ${Object.keys(obj.elements).length} entries`);
  }
  
  // Recursively check objects
  for (const key in obj) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) && 
      typeof obj[key] === 'object' && 
      obj[key] !== null &&
      key !== '_data' // Avoid potential large datasets
    ) {
      // Skip ArrayBuffers and standard array types
      if (obj[key] instanceof ArrayBuffer || ArrayBuffer.isView(obj[key])) continue;
      
      inspectMetadataStructure(obj[key], path ? `${path}.${key}` : key, level + 1, maxLevel);
    }
  }
}

// Function to fetch the full DICOM metadata from the server
async function fetchFullDicomMetadata(url) {
  try {
    // For XNAT-specific handling
    if (url.includes('/data/experiments/')) {
      // Try to get the full metadata by requesting the DICOM file directly
      const response = await axios.get(url, {
        responseType: 'arraybuffer',
      });
      
      if (response.data) {
        // Parse the DICOM file using dcmjs
        const dicomData = dcmjs.data.DicomMessage.readFile(response.data);
        const naturalized = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);
        
        // Add metadata and file meta information
        naturalized._meta = dcmjs.data.DicomMetaDictionary.namifyDataset(dicomData.meta);
        
        return naturalized;
      }
    } else {
      // Try to fetch metadata via WADO-RS
      try {
        // Extract study, series and instance UIDs from the URL if possible
        const studyMatch = url.match(/\/studies\/([^/]+)/);
        const seriesMatch = url.match(/\/series\/([^/]+)/);
        const instanceMatch = url.match(/\/instances\/([^/]+)/);
        
        if (studyMatch && seriesMatch && instanceMatch) {
          const studyUID = studyMatch[1];
          const seriesUID = seriesMatch[1];
          const instanceUID = instanceMatch[1];
          
          // Try to construct a WADO-RS metadata URL
          // This is a common pattern but may need adjustment based on your server
          const wadoUrl = url.split('/studies/')[0] + 
                         `/studies/${studyUID}/series/${seriesUID}/instances/${instanceUID}/metadata`;
          
          const wadoResponse = await axios.get(wadoUrl);
          if (wadoResponse.data && Array.isArray(wadoResponse.data) && wadoResponse.data.length > 0) {
            // WADO-RS returns an array of metadata objects, we want the first one
            const wadoMetadata = wadoResponse.data[0];
            
            // Convert from DICOM JSON format to a natural object
            const formattedMetadata = {};
            
            // Process all attributes
            for (const tag in wadoMetadata) {
              if (Object.prototype.hasOwnProperty.call(wadoMetadata, tag)) {
                const attr = wadoMetadata[tag];
                const keyword = attr.keyword || dcmjs.data.DicomMetaDictionary.dictionary[tag]?.name || tag;
                
                // Extract value based on VR
                let value = null;
                if (attr.Value !== undefined) {
                  if (attr.vr === 'SQ') {
                    // For sequences, we need to process recursively
                    // This is simplified, full implementation would be more complex
                    value = attr.Value;
                  } else if (Array.isArray(attr.Value)) {
                    // Most attributes are arrays in DICOM JSON
                    if (attr.Value.length === 1) {
                      value = attr.Value[0];
                    } else {
                      value = attr.Value;
                    }
                  }
                }
                
                // Store using the keyword for easier access
                if (value !== null) {
                  formattedMetadata[keyword] = value;
                }
              }
            }
            
            return formattedMetadata;
          }
        }
      } catch (wadoError) {
        console.log('Could not load from WADO-RS, trying other methods', wadoError);
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching or parsing DICOM file:', error);
    return null;
  }
}

export default DicomTagBrowser;
