import React from 'react';
import classnames from 'classnames';
import listComponentGenerator from './listComponentGenerator';
import ConfigPoint from 'config-point'

/**
 * Generates a viewport overlay given a configuration element.
 * The element typically comes from config-point, and contains
 * things like the topleft/topRight/bottomleft/bottomRight definitions.
 * @param {*} config is a configuration object that defines four lists of elements,
 * one topLeft, topRight, bottomLeft, bottomRight contents.
 * @returns
 */
const generateFromConfig = (config) => {
  const { topLeft, topRight, bottomLeft, bottomRight, itemGenerator } = config;

  return (props) => {
    const { imageId } = props;
    const topLeftClass = 'top-viewport left-viewport';
    const topRightClass = 'top-viewport right-viewport-scrollbar';
    const bottomRightClass = 'bottom-viewport right-viewport-scrollbar';
    const bottomLeftClass = 'bottom-viewport left-viewport';
    const overlay = 'absolute pointer-events-none';

    if (!imageId) {
      return null;
    }

    return (
      <div className="text-primary-light">
        <div
          data-cy={'viewport-overlay-top-left'}
          className={classnames(overlay, topLeftClass)}
        >
          {listComponentGenerator({ ...props, list: topLeft, itemGenerator })}
        </div>
        <div
          data-cy={'viewport-overlay-top-right'}
          className={classnames(overlay, topRightClass)}
        >
          {listComponentGenerator({ ...props, list: topRight, itemGenerator })}
        </div>
        <div
          data-cy={'viewport-overlay-bottom-right'}
          className={classnames(overlay, bottomRightClass)}
        >
          {listComponentGenerator({ ...props, list: bottomRight, itemGenerator })}
        </div>
        <div
          data-cy={'viewport-overlay-bottom-left'}
          className={classnames(overlay, bottomLeftClass)}
        >
          {listComponentGenerator({ ...props, list: bottomLeft, itemGenerator })}
        </div>
      </div>
    );
  };
};

const { ViewportOverlay } = ConfigPoint.register({
  ViewportOverlay: {
    configBase: {
      topLeft: [
        {
          id: 'zoom',
          title: 'Zoom:',
          condition: props => props.activeTools && props.activeTools.includes("Zoom"),
          value: props => props.scale && (props.scale.toFixed(2) + "x"),
        },
        {
          id: 'wwwc',
          condition: props => props.activeTools && props.activeTools.includes('Wwwc'),
          contents: props => ([
            { className: 'mr-1', value: "W:" },
            { className: 'ml-1 mr-2 font-light', value: props.windowWidth.toFixed(0) },
            { className: 'mr-1', value: "L:" },
            { className: 'ml-1 font-light', value: props.windowCenter.toFixed(0) },
          ]),
        },
      ],
      topRight: [
        {
          id: 'stackSize',
          // An example of how to run this with a dynamic, safe function
          condition: { configOperation: 'safe', value: 'stackSize > 1 && image' },
          title: "I:",
          value: props => `${props.image.InstanceNumber} (${props.imageIndex}/${props.stackSize})`,
        },
      ],
      bottomLeft: [
      ],
      bottomRight: [
      ],
      itemGenerator: props => {
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
          <div key={item.id} className="flex flex-row">
            {contentsValue.map((content, idx) => (<span key={idx} className={content.className}>{content.value}</span>))}
          </div>
        );
      },
      generateFromConfig,
    },
  }
});

export default ViewportOverlay;
