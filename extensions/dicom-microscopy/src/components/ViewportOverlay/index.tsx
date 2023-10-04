import React from 'react';
import classnames from 'classnames';

import listComponentGenerator from './listComponentGenerator';
import './ViewportOverlay.css';
import { formatDICOMDate, formatDICOMTime, formatNumberPrecision, formatPN } from './utils';

interface OverlayItem {
  id: string;
  title: string;
  value?: (props: any) => string;
  condition?: (props: any) => boolean;
  contents?: (props: any) => { className: string; value: any };
  generator?: (props: any) => any;
}

/**
 *
 * @param {*} config is a configuration object that defines four lists of elements,
 * one topLeft, topRight, bottomLeft, bottomRight contents.
 * @param {*} extensionManager is used to load the image data.
 * @returns
 */
export const generateFromConfig = ({
  topLeft = [],
  topRight = [],
  bottomLeft = [],
  bottomRight = [],
  itemGenerator = () => {},
}: {
  topLeft?: OverlayItem[];
  topRight?: OverlayItem[];
  bottomLeft?: OverlayItem[];
  bottomRight?: OverlayItem[];
  itemGenerator?: (props: any) => any;
}) => {
  return (props: any) => {
    const topLeftClass = 'top-viewport left-viewport text-primary-light';
    const topRightClass = 'top-viewport right-viewport-scrollbar text-primary-light';
    const bottomRightClass = 'bottom-viewport right-viewport-scrollbar text-primary-light';
    const bottomLeftClass = 'bottom-viewport left-viewport text-primary-light';
    const overlay = 'absolute pointer-events-none microscopy-viewport-overlay';

    return (
      <>
        {topLeft && topLeft.length > 0 && (
          <div data-cy={'viewport-overlay-top-left'} className={classnames(overlay, topLeftClass)}>
            {listComponentGenerator({ ...props, list: topLeft, itemGenerator })}
          </div>
        )}
        {topRight && topRight.length > 0 && (
          <div
            data-cy={'viewport-overlay-top-right'}
            className={classnames(overlay, topRightClass)}
          >
            {listComponentGenerator({
              ...props,
              list: topRight,
              itemGenerator,
            })}
          </div>
        )}
        {bottomRight && bottomRight.length > 0 && (
          <div
            data-cy={'viewport-overlay-bottom-right'}
            className={classnames(overlay, bottomRightClass)}
          >
            {listComponentGenerator({
              ...props,
              list: bottomRight,
              itemGenerator,
            })}
          </div>
        )}
        {bottomLeft && bottomLeft.length > 0 && (
          <div
            data-cy={'viewport-overlay-bottom-left'}
            className={classnames(overlay, bottomLeftClass)}
          >
            {listComponentGenerator({
              ...props,
              list: bottomLeft,
              itemGenerator,
            })}
          </div>
        )}
      </>
    );
  };
};

const itemGenerator = (props: any) => {
  const { item } = props;
  const { title, value: valueFunc, condition, contents } = item;
  props.image = { ...props.image, ...props.metadata };
  props.formatDate = formatDICOMDate;
  props.formatTime = formatDICOMTime;
  props.formatPN = formatPN;
  props.formatNumberPrecision = formatNumberPrecision;
  if (condition && !condition(props)) {
    return null;
  }
  if (!contents && !valueFunc) {
    return null;
  }
  const value = valueFunc && valueFunc(props);
  const contentsValue = (contents && contents(props)) || [
    { className: 'mr-1', value: title },
    { classname: 'mr-1 font-light', value },
  ];

  return (
    <div key={item.id} className="flex flex-row">
      {contentsValue.map((content, idx) => (
        <span key={idx} className={content.className}>
          {content.value}
        </span>
      ))}
    </div>
  );
};

export default generateFromConfig({});
