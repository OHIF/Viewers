import React, { useState, useMemo, useEffect } from 'react';
import { Select, Input, Slider, Typography, Table } from 'antd';
import { SearchOutlined } from '@ant-design/icons';

import { formatDicomDate } from './formatDicomDate';
import './DicomTagBrowser.css';
import { getSortedTags } from './dicomTagUtils';

const { Option } = Select;

interface DisplaySet {
  uid: string;
  displaySetInstanceUID: string;
  SeriesDate: string;
  SeriesTime: string;
  SeriesNumber: number;
  SeriesDescription: string;
  Modality: string;
  images: any[];
  instances: any;
}

interface TableDataItem {
  key: string;
  tag: string;
  vr: string;
  keyword: string;
  value: string;
  children?: TableDataItem[];
}

const DicomTagBrowser = ({
  displaySets,
  displaySetInstanceUID,
}: {
  displaySets: DisplaySet[];
  displaySetInstanceUID: string;
}): JSX.Element => {
  const [selectedDisplaySetInstanceUID, setSelectedDisplaySetInstanceUID] =
    useState(displaySetInstanceUID);
  const [instanceNumber, setInstanceNumber] = useState(1);
  const [filterValue, setFilterValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
  const [searchExpandedKeys, setSearchExpandedKeys] = useState<string[]>([]);
  const [currentDisplaySet, setCurrentDisplaySet] = useState<DisplaySet>();

  useEffect(() => {
    const displaySet = displaySets.find(
      displaySet =>
        displaySet.uid === selectedDisplaySetInstanceUID ||
        displaySet.displaySetInstanceUID === selectedDisplaySetInstanceUID
    );

    if (displaySet && !displaySet.images) {
      return setCurrentDisplaySet({ ...displaySet, images: displaySet.instances });
    }

    setCurrentDisplaySet(displaySet);
  }, [displaySets, selectedDisplaySetInstanceUID]);

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

      const dateStr = SeriesDate && SeriesTime ? `${SeriesDate}:${SeriesTime}`.split('.')[0] : '';
      const displayDate = formatDicomDate(dateStr);

      return {
        value: displaySetInstanceUID,
        label: `${SeriesNumber} (${Modality}): ${SeriesDescription}`,
        description: displayDate,
      };
    });
  }, [displaySets]);

  const showInstanceList = currentDisplaySet?.images?.length > 1;

  const instanceSliderMarks = useMemo(() => {
    if (currentDisplaySet === undefined) {
      return {};
    }
    const totalInstances = currentDisplaySet?.images?.length;

    const marks: Record<number, string> = {
      1: '1',
      [Math.ceil(totalInstances / 2)]: String(Math.ceil(totalInstances / 2)),
      [totalInstances]: String(totalInstances),
    };

    return marks;
  }, [currentDisplaySet]);

  const columns = [
    {
      title: 'Tag',
      dataIndex: 'tag',
      key: 'tag',
      width: '30%',
    },
    {
      title: 'VR',
      dataIndex: 'vr',
      key: 'vr',
      width: '5%',
    },
    {
      title: 'Keyword',
      dataIndex: 'keyword',
      key: 'keyword',
      width: '30%',
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: '40%',
    },
  ];

  const tableData = useMemo(() => {
    const transformTagsToTableData = (tags: any[], parentKey = ''): TableDataItem[] => {
      return tags.map((tag, index) => {
        const currentKey = parentKey !== undefined ? `${parentKey}-${index}` : `${index}`;

        const item: TableDataItem = {
          key: currentKey,
          tag: tag.tag,
          vr: tag.vr,
          keyword: tag.keyword,
          value: tag.value,
        };

        if (tag.children !== undefined && tag.children.length > 0) {
          item.children = transformTagsToTableData(tag.children, currentKey);
        }

        return item;
      });
    };

    if (currentDisplaySet === undefined) {
      return [];
    }
    const metadata = currentDisplaySet?.images?.[instanceNumber - 1];
    const tags = getSortedTags(metadata);
    return transformTagsToTableData(tags);
  }, [instanceNumber, currentDisplaySet]);

  const filteredData = useMemo(() => {
    if (filterValue === undefined || filterValue === '') {
      return tableData;
    }

    const searchLower = filterValue.toLowerCase();
    const newSearchExpandedKeys: string[] = [];

    const filterNodes = (nodes: TableDataItem[], parentKey = ''): TableDataItem[] => {
      return nodes
        .map(node => {
          const newNode = { ...node };

          const matchesSearch =
            (node.tag?.toLowerCase() ?? '').includes(searchLower) ||
            (node.vr?.toLowerCase() ?? '').includes(searchLower) ||
            (node.keyword?.toLowerCase() ?? '').includes(searchLower) ||
            (node.value?.toString().toLowerCase() ?? '').includes(searchLower);

          if (node.children != null) {
            const filteredChildren = filterNodes(node.children, node.key);
            newNode.children = filteredChildren;

            if (matchesSearch || filteredChildren.length > 0) {
              if (parentKey !== undefined) {
                newSearchExpandedKeys.push(parentKey);
              }
              newSearchExpandedKeys.push(node.key);
              return newNode;
            }
          }

          return matchesSearch ? newNode : null;
        })
        .filter((node): node is TableDataItem => node !== null);
    };

    const filtered = filterNodes(tableData);
    setSearchExpandedKeys(newSearchExpandedKeys);
    return filtered;
  }, [tableData, filterValue]);

  useEffect(() => {
    if (filterValue === undefined || filterValue === '') {
      setSearchExpandedKeys([]);
    }
  }, [filterValue]);

  const allExpandedKeys = useMemo(() => {
    return [...new Set([...expandedKeys, ...searchExpandedKeys])];
  }, [expandedKeys, searchExpandedKeys]);

  return (
    <div className="dicom-tag-browser h-full">
      <div className="w-full py-5 pl-4 pr-5">
        <div className="mb-8 flex h-full gap-6">
          <div className="max-w-[50%] flex-1">
            <Typography.Text
              strong
              className="mb-2 block text-white"
            >
              Series
            </Typography.Text>
            <Select
              className="w-full"
              value={selectedDisplaySetInstanceUID}
              defaultValue={0}
              onChange={value => {
                setSelectedDisplaySetInstanceUID(value);
                setInstanceNumber(1);
              }}
              optionLabelProp="label"
              optionFilterProp="label"
            >
              {displaySetList.map(item => (
                <Option
                  key={item.value}
                  value={item.value}
                  label={item.label}
                  className="bg-black text-white"
                >
                  <div>
                    <div>{item.label}</div>
                    {item.description ? <div className="text-xs">{item.description}</div> : <></>}
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          {showInstanceList && (
            <div className="ml-[-32px] max-w-[50%] flex-1 pl-[32px]">
              <Typography.Text
                strong
                className="mb-2 block text-white"
              >
                Instance Number: {instanceNumber}
              </Typography.Text>
              <Slider
                min={1}
                max={currentDisplaySet?.images?.length}
                value={instanceNumber}
                onChange={value => setInstanceNumber(value)}
                marks={instanceSliderMarks}
                tooltip={{
                  formatter: (value: number | undefined) =>
                    value !== undefined ? `Instance ${value}` : '',
                }}
              />
            </div>
          )}
        </div>

        <Input
          className="mb-5 max-w-[50%] border-[#3a3f99] bg-black text-[#7bb2ce]"
          placeholder="Search metadata..."
          prefix={<SearchOutlined />}
          onChange={e => setFilterValue(e.target.value)}
          value={filterValue}
        />

        <Table
          className="h-96 bg-black text-white"
          columns={columns}
          dataSource={filteredData}
          pagination={false}
          expandable={{
            expandedRowKeys: allExpandedKeys,
            onExpandedRowsChange: keys => setExpandedKeys(keys as string[]),
          }}
          size="small"
          scroll={{ y: 350 }}
          locale={{
            emptyText: (
              <div className="flex h-80 w-full items-center justify-center text-white">No data</div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default DicomTagBrowser;
