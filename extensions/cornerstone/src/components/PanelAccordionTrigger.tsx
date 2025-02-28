import React from 'react';
import { AccordionTrigger, ColorCircle } from '@ohif/ui-next';

function onClickDefault(e) {
  const { group, onClick = group?.onClick } = this;
  if (!onClick) {
    console.log('No onClick function', group);
    return;
  }
  e.preventDefault();
  e.stopPropagation();

  onClick(e, group);

  return false;
}

export default function PanelAccordionTrigger(props) {
  const { marginLeft = 8, isActive = false, colorHex, count, text, menu: Menu = null } = props;

  return (
    <AccordionTrigger style={{ margin: `1px 0px 1px ${marginLeft}px`, padding: 0 }}>
      <button
        className={`inline-flex text-base ${isActive ? 'bg-popover' : 'bg-muted'} flex-grow`}
        onClick={onClickDefault.bind(props)}
      >
        <span
          className={`inline-flex rounded-l border-r border-black ${isActive ? 'bg-highlight' : 'bg-muted'}`}
        >
          {count !== undefined ? <span className="px-2">{count}</span> : null}
          {colorHex && <ColorCircle colorHex={colorHex} />}
        </span>
        <span onClick={onClickDefault.bind(props)}>{text}</span>
        {Menu && (
          <Menu
            {...props}
            classNames="justify-end flex-grow"
          />
        )}
      </button>
    </AccordionTrigger>
  );
}
