import React, { createRef, useEffect, useRef, useState } from 'react';
import { VariableSizeList as List } from 'react-window';
import classNames from 'classnames';

const lineHeightPx = 20;
const lineHeightClassName = `leading-[${lineHeightPx}px]`;
const rowVerticalPaddingPx = 10;
const rowVerticalPaddingClassName = `py-[${rowVerticalPaddingPx}px]`;

function ColumnHeaders({ tagRef, vrRef, keywordRef, valueRef }) {
  return (
    <div
      className={classNames(
        'flex flex-row w-full bg-secondary-light ohif-scrollbar overflow-y-scroll',
        rowVerticalPaddingClassName
      )}
    >
      <div className="px-3 w-5/24">
        <label
          ref={tagRef}
          className="flex flex-col flex-1 text-white text-lg pl-1 select-none"
        >
          <span className="flex flex-row items-center focus:outline-none">
            Tag
          </span>
        </label>
      </div>
      <div className="px-3 w-4/24">
        <label
          ref={vrRef}
          className="flex flex-col flex-1 text-white text-lg pl-1 select-none"
        >
          <span className="flex flex-row items-center focus:outline-none">
            VR
          </span>
        </label>
      </div>
      <div className="px-3 w-6/24">
        <label
          ref={keywordRef}
          className="flex flex-col flex-1 text-white text-lg pl-1 select-none"
        >
          <span className="flex flex-row items-center focus:outline-none">
            Keyword
          </span>
        </label>
      </div>
      <div className="px-3 w-5/24 grow">
        <label
          ref={valueRef}
          className="flex flex-col flex-1 text-white text-lg pl-1 select-none"
        >
          <span className="flex flex-row items-center focus:outline-none">
            Value
          </span>
        </label>
      </div>
    </div>
  );
}

function DicomTagTable({ rows }) {
  const listRef = useRef();
  const canvasRef = useRef();

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
  React.useEffect(() => {
    function handleResize() {
      listRef.current.resetAfterIndex(0);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });

  const Row = ({ index, style }) => {
    const row = rows[index];

    return (
      <div
        style={style}
        className={classNames(
          'hover:bg-secondary-main transition duration-300 bg-primary-dark flex flex-row py-2 w-full border-b border-secondary-light items-center text-base break-all',
          rowVerticalPaddingClassName,
          lineHeightClassName
        )}
        key={`DICOMTagRow-${index}`}
      >
        <div className="px-3 w-5/24">{row[0]}</div>
        <div className="px-3 w-4/24">{row[1]}</div>
        <div className="px-3 w-6/24">{row[2]}</div>
        <div className="px-3 w-5/24 grow">{row[3]}</div>
      </div>
    );
  };

  const [tagHeaderElem, setTagHeaderElem] = useState(null);
  const [vrHeaderElem, setVrHeaderElem] = useState(null);
  const [keywordHeaderElem, setKeywordHeaderElem] = useState(null);
  const [valueHeaderElem, setValueHeaderElem] = useState(null);

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

  const isHeaderRendered = () => tagHeaderElem != null;
  /**
   * Get the item/row size. We use the header column widths to calculate the various row heights.
   * @param index the row index
   * @returns the row height
   */
  const getItemSize = index => {
    const headerWidths = [
      tagHeaderElem.offsetWidth,
      vrHeaderElem.offsetWidth,
      keywordHeaderElem.offsetWidth,
      valueHeaderElem.offsetWidth,
    ];

    const context = canvasRef.current.getContext('2d');
    context.font = getComputedStyle(canvasRef.current).font;

    return rows[index]
      .map((colText, index) => {
        const colOneLineWidth = context.measureText(colText).width;
        const numLines = Math.ceil(colOneLineWidth / headerWidths[index]);
        return numLines * lineHeightPx + 2 * rowVerticalPaddingPx;
      })
      .reduce((maxHeight, colHeight) => Math.max(maxHeight, colHeight));
  };

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
        className="m-auto relative border-2 border-secondary-light"
        style={{ height: '32rem' }}
      >
        {isHeaderRendered() && (
          <List
            ref={listRef}
            height={500}
            itemCount={rows.length}
            itemSize={getItemSize}
            width={'100%'}
            className="ohif-scrollbar"
          >
            {Row}
          </List>
        )}
      </div>
    </div>
  );
}

export default DicomTagTable;
