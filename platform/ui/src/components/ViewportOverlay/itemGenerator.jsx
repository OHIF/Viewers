import React from 'react';
import PropTypes from 'prop-types';

/**
 * Use the props values to generate viewport overlay items such as
 * patient name overlay items.
 */
const itemGenerator = props => {
  const { item } = props;
  const { title, value: valueFunc, condition, contents } = item;
  if (condition && !condition(props)) return null;
  if (!contents && !valueFunc) return null;
  const value = valueFunc && valueFunc(props);
  const contentsValue = contents && contents(props) ||
    [
      { className: "mr-1", value: title },
      { classname: "mr-1 font-light", value }
    ];

  return (
    <div key={item.dataCy} data-cy={item.dataCy} className="flex flex-row">
      {contentsValue.map((content, idx) => (<span key={idx} className={content.className}>{content.value}</span>))}
    </div>
  );
};

itemGenerator.propTypes = {
  item: PropTypes.shape({
    title: PropTypes.string,
    dataCy: PropTypes.string.isRequired,
    valueFunc: PropTypes.func.isRequired,
    condition: PropTypes.func,
  }).isRequired,

};

export default itemGenerator;
