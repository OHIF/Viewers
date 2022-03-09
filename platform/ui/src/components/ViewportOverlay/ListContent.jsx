import React from 'react';
import classnames from 'classnames';
import listComponentGenerator from './listComponentGenerator';

const overlay = 'absolute pointer-events-none';

/**
 * Generates the list content for a viewport overlay object.
 *
 * @param {*} props to use for rendering in the item
 * @param {*} item to render in this location
 * @param {*} config containing the default generator
 * @param {*} index of the item
 * @returns React component
 */
export default function ListContent(props, item, config, index) {
  const { dataCy, className, contents } = item;
  const { itemGenerator } = config;

  if (!contents || !contents.length) return null;

  return <div
    key={index}
    data-cy={dataCy}
    className={classnames(overlay, className)}
  >
    {listComponentGenerator({ ...props, contents, itemGenerator })}
  </div>
}
