import React, { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import classNames from 'classnames';
import debounce from 'lodash.debounce';
import { Row } from './DicomTagBrowser';
import { Icons } from '@ohif/ui-next';

const lineHeightPx = 20;
const lineHeightClassName = `leading-[${lineHeightPx}px]`;
const rowVerticalPaddingPx = 10;
const rowBottomBorderPx = 1;
const rowVerticalPaddingStyle = { padding: `${rowVerticalPaddingPx}px 0` };
const rowStyle = {
  borderBottomWidth: `${rowBottomBorderPx}px`,
  ...rowVerticalPaddingStyle,
};
const indentationPadding = 4;

const RowComponent = ({
  row,
  style,
  keyPrefix,
  getMultipleRowsHeight,
  firstColumnPadding = indentationPadding,
  onToggle,
  parentsAreChildrenVisible,
}: {
  row: Row;
  style: any;
  keyPrefix: string;
  getMultipleRowsHeight: any;
  firstColumnPadding?: number;
  onToggle?: () => void;
  parentsAreChildrenVisible?: boolean;
}) => {
  const [areChildrenVisible, setAreChildrenVisible] = useState(true);
  const { children, ...restOfRow } = row;

  if (children) {
    const toggleChildren = () => {
      setAreChildrenVisible(prev => {
        const newState = !prev;
        restOfRow.areChildrenVisible = newState;
        return newState;
      });
    };
    let accumulatedHeight = 0;
    return (
      <>
        {[restOfRow, ...children]
          .filter((_, j) => {
            if (areChildrenVisible) {
              return true;
            }
            return j === 0;
          })
          .map((row, i) => {
            const isParentRow = i === 0;
            const rowHeight = getMultipleRowsHeight(row);
            const topOffset = accumulatedHeight;
            accumulatedHeight += rowHeight;
            return (
              <RowComponent
                row={row}
                style={{
                  ...style,
                  height: rowHeight,
                  top: style.top + topOffset,
                }}
                keyPrefix={`${keyPrefix}-${i}`}
                key={`${keyPrefix}-${i}`}
                getMultipleRowsHeight={getMultipleRowsHeight}
                firstColumnPadding={
                  isParentRow ? firstColumnPadding : firstColumnPadding + indentationPadding
                }
                onToggle={isParentRow ? toggleChildren : undefined}
                parentsAreChildrenVisible={areChildrenVisible}
              />
            );
          })}
      </>
    );
  }

  return (
    <div
      style={{ ...style, ...rowStyle }}
      className={classNames(
        'hover:bg-secondary-main border-secondary-light flex w-full flex-row items-center break-all bg-black text-base transition duration-300',
        lineHeightClassName
      )}
      key={keyPrefix}
    >
      <div style={{ paddingLeft: `${firstColumnPadding}px` }}>
        {onToggle ? (
          parentsAreChildrenVisible ? (
            <Icons.ArrowDown onClick={onToggle} />
          ) : (
            <Icons.ArrowRight onClick={onToggle} />
          )
        ) : (
          <></>
        )}
      </div>
      <div className="w-4/24 px-3">{row.tag}</div>
      <div className="w-2/24 px-3">{row.valueRepresentation}</div>
      <div className="w-6/24 px-3">{row.keyword}</div>
      <div className="w-5/24 grow px-3">{row.value}</div>
    </div>
  );
};

function ColumnHeaders({ tagRef, vrRef, keywordRef, valueRef }) {
  return (
    <div
      className={classNames(
        'bg-secondary-dark ohif-scrollbar flex w-full flex-row overflow-y-scroll'
      )}
      style={rowVerticalPaddingStyle}
    >
      <div className="w-4/24 px-3">
        <label
          ref={tagRef}
          className="flex flex-1 select-none flex-col pl-1 text-lg text-white"
        >
          <span className="flex flex-row items-center focus:outline-none">Tag</span>
        </label>
      </div>
      <div className="w-2/24 px-3">
        <label
          ref={vrRef}
          className="flex flex-1 select-none flex-col pl-1 text-lg text-white"
        >
          <span className="flex flex-row items-center focus:outline-none">VR</span>
        </label>
      </div>
      <div className="w-6/24 px-3">
        <label
          ref={keywordRef}
          className="flex flex-1 select-none flex-col pl-1 text-lg text-white"
        >
          <span className="flex flex-row items-center focus:outline-none">Keyword</span>
        </label>
      </div>
      <div className="w-5/24 grow px-3">
        <label
          ref={valueRef}
          className="flex flex-1 select-none flex-col pl-1 text-lg text-white"
        >
          <span className="flex flex-row items-center focus:outline-none">Value</span>
        </label>
      </div>
    </div>
  );
}
function DicomTagTable({ rows }: { rows: Row[] }) {
  const listRef = useRef();
  const canvasRef = useRef();

  const [tagHeaderElem, setTagHeaderElem] = useState(null);
  const [vrHeaderElem, setVrHeaderElem] = useState(null);
  const [keywordHeaderElem, setKeywordHeaderElem] = useState(null);
  const [valueHeaderElem, setValueHeaderElem] = useState(null);

  // Here the refs are inturn stored in state to trigger a render of the table.
  // This virtualized table does NOT render until the header is rendered because the header column widths are used to determine the row heights in the table.
  // Therefore whenever the refs change (in particular the first time the refs are set), we want to trigger a render of the table.
  const tagRef = elem => {
    if (elem) {
      setTagHeaderElem(elem);
    }
  };
  const vrRef = elem => {
    if (elem) {
      setVrHeaderElem(elem);
    }
  };
  const keywordRef = elem => {
    if (elem) {
      setKeywordHeaderElem(elem);
    }
  };
  const valueRef = elem => {
    if (elem) {
      setValueHeaderElem(elem);
    }
  };

  /**
   * When new rows are set, scroll to the top and reset the virtualization.
   */
  useEffect(() => {
    if (!listRef?.current) {
      return;
    }

    listRef.current.scrollTo(0);
    listRef.current.resetAfterIndex(0);
  }, [rows]);

  /**
   * When the browser window resizes, update the row virtualization (i.e. row heights)
   */
  useEffect(() => {
    const debouncedResize = debounce(() => listRef.current.resetAfterIndex(0), 100);

    window.addEventListener('resize', debouncedResize);

    return () => {
      debouncedResize.cancel();
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  const getOneRowHeight = useCallback(
    row => {
      const headerWidths = [
        tagHeaderElem.offsetWidth,
        vrHeaderElem.offsetWidth,
        keywordHeaderElem.offsetWidth,
        valueHeaderElem.offsetWidth,
      ];

      const context = canvasRef.current.getContext('2d');
      context.font = getComputedStyle(canvasRef.current).font;

      return Object.values(row)
        .map((colText, index) => {
          const colOneLineWidth = context.measureText(colText).width;
          const numLines = Math.ceil(colOneLineWidth / headerWidths[index]);
          return numLines * lineHeightPx + 2 * rowVerticalPaddingPx + rowBottomBorderPx;
        })
        .reduce((maxHeight, colHeight) => Math.max(maxHeight, colHeight), 0);
    },
    [keywordHeaderElem, tagHeaderElem, valueHeaderElem, vrHeaderElem]
  );

  const getMultipleRowsHeight = useCallback(
    row => {
      const { children, areChildrenVisible, ...restOfRow } = row;
      const parentHeight = getOneRowHeight(restOfRow);
      const childrenHeight =
        !Array.isArray(children) || !areChildrenVisible
          ? 0
          : children.reduce((sum, childRow) => sum + getMultipleRowsHeight(childRow), 0);

      return parentHeight + childrenHeight;
    },
    [getOneRowHeight]
  );

  /**
   * Get the item/row size. We use the header column widths to calculate the various row heights.
   * @param index the row index
   * @returns the row height
   */
  const getItemSize = useCallback(
    rows => index => {
      const row = rows[index];
      return getMultipleRowsHeight(row);
    },
    [getMultipleRowsHeight]
  );

  const getRowComponent = useCallback(
    ({ rows }: { rows: Row[] }) =>
      function RowList({ index, style }) {
        const row = rows[index];
        return (
          <RowComponent
            style={style}
            row={row}
            keyPrefix={`DICOMTagRow-${index}`}
            getMultipleRowsHeight={getMultipleRowsHeight}
          />
        );
      },
    [getMultipleRowsHeight]
  );

  /**
   * Whenever any one of the column headers is set, then the header is rendered.
   * Here we chose the tag header.
   */
  const isHeaderRendered = useCallback(() => tagHeaderElem !== null, [tagHeaderElem]);

  return (
    <div>
      <canvas
        style={{ visibility: 'hidden', position: 'absolute' }}
        className="text-base"
        ref={canvasRef}
      />
      <ColumnHeaders
        tagRef={tagRef}
        vrRef={vrRef}
        keywordRef={keywordRef}
        valueRef={valueRef}
      />
      <div
        className="relative m-auto border-2 border-black bg-black"
        style={{ height: '32rem' }}
      >
        {isHeaderRendered() && (
          <List
            ref={listRef}
            height={500}
            itemCount={rows.length}
            itemSize={getItemSize(rows)}
            width={'100%'}
            className="ohif-scrollbar"
          >
            {getRowComponent({ rows })}
          </List>
        )}
      </div>
    </div>
  );
}

export default DicomTagTable;
