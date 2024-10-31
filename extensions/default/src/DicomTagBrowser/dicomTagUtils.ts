import dcmjs from 'dcmjs';

const { DicomMetaDictionary } = dcmjs.data;
const { nameMap } = DicomMetaDictionary;

interface TagInfo {
  tag: string;
  vr: string;
  keyword: string;
  value: string;
  children?: TagInfo[];
  level: number;
}

export interface DicomTag {
  name: string;
  vr: string;
  Value?: any[];
  [key: string]: any;
}

const formatValue = (val: any): string => {
  if (typeof val === 'object' && val !== null) {
    return JSON.stringify(val);
  }
  return String(val);
};

export const formatTagValue = (tag: DicomTag): string => {
  if (tag.Value == null) {
    return '';
  }

  if (Array.isArray(tag.Value)) {
    return tag.Value.map(formatValue).join(', ');
  }

  return formatValue(tag.Value);
};

export function getPrivateTagValue({ value, tag }) {
  if (value === null || value === undefined) {
    return ' ';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value.InlineBinary) {
    return 'Inline Binary';
  }

  if (value.BulkDataURI) {
    return `Bulk Data URI`;
  }

  if (value.Alphabetic) {
    return value.Alphabetic;
  }

  if (typeof value.toString === 'function') {
    return value.toString();
  }

  console.warn(`Unrecognised value: ${value} for ${tag}:`);
  console.warn(value);
  return ' ';
}

/**
 * Processes DICOM metadata and returns a flattened array of tag information
 * @param metadata - The DICOM metadata object to process
 * @param depth - The current depth level for nested sequences (default: 0)
 * @returns Array of processed tag information
 */
export function getRows(metadata: Record<string, any>, depth = 0): TagInfo[] {
  const keywords = Object.keys(metadata).filter(key => key !== '_vrMap');

  return keywords.flatMap(keyword => {
    const tagInfo = nameMap[keyword] as TagInfo | undefined;
    let value = metadata[keyword];

    // Handle private or unknown tags
    if (tagInfo === undefined) {
      const regex = /[0-9A-Fa-f]{6}/g;
      if (keyword.match(regex) == null) {
        return [];
      }

      const tag = `(${keyword.substring(0, 4)},${keyword.substring(4, 8)})`;
      const valueToShow = getPrivateTagValue({ value, tag });

      return [
        {
          tag,
          vr: '',
          keyword: 'Private Tag',
          value: valueToShow,
          level: depth,
        },
      ];
    }

    // Handle sequence values (SQ VR)
    if (tagInfo.vr === 'SQ' && value !== undefined && value !== null) {
      const sequenceItems = Array.isArray(value) ? value : [value];

      // Create a parent sequence node
      const sequenceNode: TagInfo = {
        tag: tagInfo.tag,
        vr: tagInfo.vr,
        keyword,
        value: `Sequence with ${sequenceItems.length} item(s)`,
        level: depth,
        children: [],
      };

      // Create individual nodes for each sequence item
      sequenceNode.children = sequenceItems.map((item, index) => {
        const itemNode: TagInfo = {
          tag: `${tagInfo.tag}.${index + 1}`,
          vr: 'Item',
          keyword: `Item ${index + 1}`,
          value: `Sequence Item ${index + 1}`,
          level: depth + 1,
          children: getRows(item, depth + 2),
        };
        return itemNode;
      });

      return [sequenceNode];
    }

    // Handle array values
    if (Array.isArray(value)) {
      value = value.map(formatValue).join('\\');
    } else if (typeof value === 'object' && value !== null) {
      value = formatValue(value);
    }

    return [
      {
        tag: tagInfo.tag,
        vr: tagInfo.vr,
        keyword: keyword.replace('RETIRED_', ''),
        value: value?.toString() ?? '',
        level: depth,
      },
    ];
  });
}

/**
 * Sorts DICOM tags alphabetically by tag value
 * @param metadata - The DICOM metadata object to process
 * @returns Sorted array of tag information
 */
export function getSortedTags(metadata: Record<string, any>): TagInfo[] {
  const tagList = getRows(metadata);
  return tagList.sort((a, b) => a.tag.localeCompare(b.tag));
}
